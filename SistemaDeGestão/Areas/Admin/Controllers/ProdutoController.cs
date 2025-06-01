using Microsoft.AspNetCore.Mvc;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Services;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Hosting;
using static System.Net.Mime.MediaTypeNames;
using SistemaDeGestao.Models.DTOs.Resquests;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/1.0/[controller]")]
    public class ProdutoController : ControllerBase
    {
        private readonly DataBaseContext _context;
        private readonly ProdutoService _produtoService;
        private readonly IImageUploadService _imageUploadService;
        private readonly CategoriaService _categoriaService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly RestauranteService _restauranteService;
        public ProdutoController(DataBaseContext context, ProdutoService produtoService, IImageUploadService imageUploadService, CategoriaService categoria, IWebHostEnvironment webHostEnvironment, RestauranteService restauranteService
            , CategoriaService categoriaService)
        {
            _context = context;
            _produtoService = produtoService;
            _imageUploadService = imageUploadService;
            _categoriaService = categoria;
            _webHostEnvironment = webHostEnvironment;
            _restauranteService = restauranteService;
        }

        [HttpGet]
        [Route("ListarMaisVendidosPorLoja/{nomeDaLoja}")]
        public async Task<IActionResult> ListarMaisVendidosPorLoja(string nomeDaLoja)
        {
            var restaurante = await _context.Restaurantes
                .FirstOrDefaultAsync(r => r.NomeDaLoja == nomeDaLoja);

            if (restaurante == null)
                return NotFound("Restaurante não encontrado.");

            var produtos = await _produtoService.ObterProdutosMaisVendidos(restaurante.Id);
            return Ok(produtos);
        }

        [HttpGet]
        [Route("ListarProdutos")]
        public async Task<IActionResult> ListarProdutos()
        {
            var restauranteIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(restauranteIdClaim) || !int.TryParse(restauranteIdClaim, out var restauranteId))
            {
                return BadRequest("O ID do restaurante não foi encontrado ou não é válido.");
            }

            var produtos = await _produtoService.ListarProdutos(restauranteId);
            return Ok(produtos);
        }

        [HttpGet("BuscarPorSlug/{slug}")]
        public async Task<ActionResult<RestauranteDTO>> BuscarPorSlug(string slug)
        {
            try
            {
                var loja = await _produtoService.ObterLojaPorSlug(slug);

                if (loja == null)
                    return NotFound("Loja não encontrada");

                var lojaDTO = new RestauranteDTO
                {
                    Id = loja.Id,
                    Nome = loja.NomeDaLoja,
                    Slug = loja.NomeDaLoja,
                    //Descricao = loja.Descricao,
                    //LogoUrl = loja.LogoUrl,
                    Categorias = loja.Categorias?.Select(c => new Categoria
                    {
                        Id = c.Id,
                        Nome = c.Nome
                    }).ToList()
                };

                return Ok(lojaDTO);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro interno ao buscar loja");
            }
        }

        [HttpGet("ListarProdutosPorLoja/{lojaId}")]
        public async Task<ActionResult<Produto>> ListarProdutosPorLoja(int lojaId)
        {
            var produtos = await _produtoService.ListarProdutosPorLoja(lojaId);
            return Ok(produtos);
        }

        [HttpPost]
        [Route("CriarProduto")]
        public async Task<IActionResult> CriarProduto([FromForm] ProdutoDTO produtoDTO)
        {
            try
            {
                var restauranteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (restauranteId == null)
                    if (string.IsNullOrEmpty(restauranteId))
                        return BadRequest("Restaurante não identificado");

                // Deserializar os complementos do JSON 
                if (!string.IsNullOrEmpty(Request.Form["complementosJson"]))
                {
                    produtoDTO.Complementos = JsonSerializer.Deserialize<List<ComplementoDTO>>(
                        Request.Form["complementosJson"].ToString(),
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );
                }

                // Deserializar os adicionais do JSON
                if (!string.IsNullOrEmpty(Request.Form["adicionaisIdsJson"]))
                {
                    produtoDTO.AdicionaisIds = JsonSerializer.Deserialize<List<int>>(
                        Request.Form["adicionaisIdsJson"].ToString(),
                        new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
                    );
                }
                var restaurante = await _restauranteService.GetRestauranteByUserIdAsync(User);
                if (restaurante == null) return null;

                var produto = await _produtoService.CriarProdutoDTO(produtoDTO, restauranteId, restaurante.NomeDaLoja);
                if (produto == null)
                    return BadRequest("Não foi possível criar o produto");

                return CreatedAtAction(nameof(GetProduto), new { id = produto.Id }, produto);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao criar produto 1: {ex.Message}");
            }
        }

        [HttpGet]
        [Route("ObterProduto/{id}")]
        public async Task<IActionResult> ObterProduto(int id)
        {
            var produto = await _produtoService.ObterProduto(id);
            if (produto == null) return NotFound("Produto não encontrado");
            return Ok(produto);
        }

        [HttpPut("AtualizarProdutoV2")]
        public async Task<IActionResult> AtualizarProdutoV2([FromForm] ProdutoDTO produto)
        {
            try
            {
                List<int> complementosIds = new List<int>();
                foreach (var key in Request.Form.Keys)
                {
                    if (key.StartsWith("ComplementosIds["))
                    {
                        if (int.TryParse(Request.Form[key], out int complementoId))
                        {
                            complementosIds.Add(complementoId);
                        }
                    }
                }
                List<int> adicionaisIds = new List<int>();
                foreach (var key in Request.Form.Keys)
                {
                    if (key.StartsWith("AdicionaisIds["))
                    {
                        if (int.TryParse(Request.Form[key], out int adicionalId))
                        {
                            adicionaisIds.Add(adicionalId);
                        }
                    }
                }

                var restaurante = await _restauranteService.GetRestauranteByUserIdAsync(User);
                if (restaurante == null) return null;

                var produtoExistente = await _context.Produtos
                .Include(p => p.Categoria) 
                .FirstOrDefaultAsync(p => p.Id == produto.Id);

                if (produtoExistente == null)
                    return NotFound("Produto não encontrado");

                var categoriaNome = produtoExistente.Categoria?.Nome;

                var produtoAtualizado = await _produtoService.AtualizarProdutoV2(
                    produto,
                    complementosIds,
                    adicionaisIds,
                    restaurante.NomeDaLoja,
                    categoriaNome);

                if (produtoAtualizado == null)
                    return NotFound("Produto não encontrado");

                return Ok(produtoAtualizado);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        //Deleta Produto
        [HttpDelete("DeletarProduto/{id}")]
        public async Task<IActionResult> DeletarProduto(int id)
        {
            await _produtoService.DeletarProduto(id);
            return NoContent();
        }

        //Deleta todos
        [HttpDelete]
        [Route("DeleteAll")]
        public async Task<IActionResult> DeleteAll()
        {
            await _produtoService.DeleteAll();
            return Ok();
        }

        //Get produto por Id
        [HttpGet("{id}")]
        public async Task<ActionResult<Produto>> GetProduto(int id)
        {
            var produto = await _context.Produtos
                .Include(p => p.Categoria)
                .Include(p => p.Complementos)
                .Include(p => p.Adicionais)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (produto == null)
                return NotFound();

            return produto;
        }
    }
}
