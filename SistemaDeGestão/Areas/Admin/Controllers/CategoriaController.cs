using Microsoft.AspNetCore.Mvc;
using SistemaDeGestao.Models;
using SistemaDeGestao.Services;
using System.Security.Claims;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class CategoriaController : Controller
    {
        private readonly CategoriaService _categoriaService;
        public CategoriaController(CategoriaService categoriaService)
        {
            _categoriaService = categoriaService;
        }
        [HttpGet]
        [Route("ListarCategorias")]
        public async Task<IActionResult> ListarCategorias()
        {
            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            return Ok(await _categoriaService.ListarCategorias(restauranteId));
        }
        [HttpGet("ListarCategoriasPorLoja/{id}")]
        public async Task<ActionResult<IEnumerable<Categoria>>> ListarCategoriasPorLoja(int id)
        {
            try
            {
                var categorias = await _categoriaService.ListarCategoriasPorLoja(id);
                var categoriasDTO = categorias.Select(c => new Categoria
                {
                    Id = c.Id,
                    Nome = c.Nome
                });

                return Ok(categoriasDTO);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro interno ao buscar categorias");
            }
        }

        [HttpGet("ListarCategoriasPorLojaGestao")]
        public async Task<ActionResult<IEnumerable<Categoria>>> ListarCategoriasPorLojaGestao()
        {
            try
            {
                var restauranteId = User.FindFirst(ClaimTypes.NameIdentifier);
                if (restauranteId == null)
                {
                    return Unauthorized("Usuário não autenticado.");
                }
                if (int.TryParse(restauranteId.Value, out var userId));
                var categorias = await _categoriaService.ListarCategoriasPorLoja(userId);
                var categoriasDTO = categorias.Select(c => new Categoria
                {
                    Id = c.Id,
                    Nome = c.Nome
                });

                return Ok(categoriasDTO);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro interno ao buscar categorias");
            }
        }

        [HttpPost]
        [Route("CriarCategoria")]
        public async Task<IActionResult> CriarCategoria([FromBody] Categoria categoria)
        {

            var categoriaResult = await _categoriaService.CriarCategoria(categoria);
            if (categoriaResult == null) return BadRequest("Erro ao criar complemento");
            return Ok(categoriaResult);
        }

        [HttpPut]
        [Route("AtualizarCategoria")]
        public async Task<IActionResult> AtualizarCategoria([FromBody] Categoria categoria)
        {
            var categoriaResult = await _categoriaService.AtualizarCategoria(categoria);
            if (categoriaResult == null) return BadRequest("Não foi possivel atualizar a Categoria");
            return Ok(categoriaResult);
        }

        [HttpDelete("DeletarCategoria/{id}")]
        public async Task<IActionResult> DeletarProduto(int id)
        {
            await _categoriaService.DeletarCategoria(id);
            return NoContent();
        }
        [HttpPost]
        [Route("AdicionarCategoriaAProduto")]
        public async Task<IActionResult> AdicionarCategoriaAProduto([FromBody] Dictionary<string, int> ids)
        {
            if (!ids.ContainsKey("categoriaId") || !ids.ContainsKey("produtoId"))
            {
                return BadRequest("Os IDs de categoria e produto são necessários.");
            }

            int categoriaId = ids["categoriaId"];
            int produtoId = ids["produtoId"];
            var resultado = await _categoriaService.AdicionarCategoriaAoProduto(produtoId, categoriaId);

            if (resultado == null)
            {
                return BadRequest("Erro ao vincular categoria ao produto");
            }

            return Ok(resultado);
        }

    }
}
