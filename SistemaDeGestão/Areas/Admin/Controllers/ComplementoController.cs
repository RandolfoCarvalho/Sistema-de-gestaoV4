using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using SistemaDeGestão.Models;
using SistemaDeGestão.Services;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SistemaDeGestão.Models.DTOs.Resquests;

namespace SistemaDeGestão.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class ComplementoController : Controller
    {
        private readonly ComplementoService _complementoService;
        public ComplementoController(ComplementoService complementoService)
        {
            _complementoService = complementoService;
        }

        [HttpGet]
        [Route("ListarComplementos")]
        public async Task<IActionResult> ListarComplementos()
        {
            var complementos = await _complementoService.ListarComplementos();
            var complementosDto = complementos.Select(c => new ComplementoDTO
            {
                Id = c.Id,
                Nome = c.Nome,
                Descricao = c.Descricao,
                Preco = c.Preco,
                Ativo = c.Ativo,
                MaximoPorProduto = c.MaximoPorProduto,
                GrupoComplementoId = c.GrupoComplementoId // Se necessário
            });

            return Ok(complementosDto);
        }

        [HttpPost]
        [Route("CriarComplemento")]
        public async Task<IActionResult> CriarComplemento([FromBody] ComplementoDTO complementoDto)
        {
            var complemento = new Complemento
            {
                Nome = complementoDto.Nome,
                Descricao = complementoDto.Descricao,
                Ativo = complementoDto.Ativo,
                MaximoPorProduto = complementoDto.MaximoPorProduto,
                GrupoComplementoId = complementoDto.GrupoComplementoId
            };

            var complementoResult = await _complementoService.CriarComplemento(complemento);
            if (complementoResult == null) return BadRequest("Erro ao criar complemento");

            var resultDto = new ComplementoDTO
            {
                Id = complementoResult.Id,
                Nome = complementoResult.Nome,
                Descricao = complementoResult.Descricao,
                Preco = complementoResult.Preco,
                Ativo = complementoResult.Ativo,
                MaximoPorProduto = complementoResult.MaximoPorProduto,
                GrupoComplementoId = complementoResult.GrupoComplementoId
            };

            return Ok(resultDto);
        }
        [HttpGet("ObterComplementos/{produtoId}")]
        public async Task<ActionResult<List<ComplementoDTO>>> ObterComplementos(int produtoId)
        {
            try
            {
                var complementos = await _complementoService.ObterComplementosPorProdutoId(produtoId);
                return Ok(complementos);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut]
        [Route("AtualizarComplemento")]
        public async Task<IActionResult> AtualizarComplemento([FromBody] ComplementoDTO complementoDto)
        {
            var complemento = new Complemento
            {
                Id = complementoDto.Id,
                Nome = complementoDto.Nome,
                Descricao = complementoDto.Descricao,
                Ativo = complementoDto.Ativo,
                MaximoPorProduto = complementoDto.MaximoPorProduto,
                GrupoComplementoId = complementoDto.GrupoComplementoId
            };

            var complementoResult = await _complementoService.AtualizarComplemento(complemento);
            if (complementoResult == null) throw new Exception("Erro ao atualizar complemento");

            var resultDto = new ComplementoDTO
            {
                Id = complementoResult.Id,
                Nome = complementoResult.Nome,
                Descricao = complementoResult.Descricao,
                Preco = complementoResult.Preco,
                Ativo = complementoResult.Ativo,
                MaximoPorProduto = complementoResult.MaximoPorProduto,
                GrupoComplementoId = complementoResult.GrupoComplementoId
            };

            return Ok(resultDto);
        }

        [HttpDelete]
        [Route("DeletarComplemento/{id}")]
        public async Task<IActionResult> DeletarComplemento(int id)
        {
            await _complementoService.DeletarComplemento(id);
            return NoContent();
        }

        //-------------------------------------------------------------------------------//

        // Grupos adicionais
        [HttpGet]
        [Route("ListarGrupoComplementos")]
        public async Task<IActionResult> ListarGrupoComplementos()
        {
            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            return Ok(await _complementoService.ListarGrupoComplementos(restauranteId));
        }

        [HttpGet]
        [Route("ListarGrupoComplementos/{id}")]
        public async Task<IActionResult> ListarGrupoAdicionaisPorId(int id)
        {
            var grupoAdicional = await _complementoService.ListarGrupoComplementoPorId(id);
            if (grupoAdicional == null)
            {
                return NotFound("Grupo de adicionais não encontrado.");
            }
            return Ok(grupoAdicional);
        }

        [HttpGet]
        [Route("ListarGrupoComplementosAtivosEInativos")]
        public async Task<IActionResult> ListarGrupoComplementosAtivosEInativos()
        {
            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            return Ok(await _complementoService.ListarGrupoComplementosAtivosEInativos(restauranteId));
        }

        [HttpPost]
        [Route("CriarGrupoComplemento")]
        public async Task<IActionResult> CriarGrupoComplemento([FromBody] GrupoComplemento grupoComplemento)
        {
            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            grupoComplemento.RestauranteId = restauranteId;
            var grupoComplementoResult = await _complementoService.CriarGrupoComplemento(grupoComplemento);
            if (grupoComplementoResult == null) return BadRequest("Erro ao criar grupo complemento");
            return Ok(grupoComplementoResult);
        }

        [HttpGet]
        [Route("ListarGrupoComplementosPorProduto/{produtoId}")]
        public async Task<IActionResult> ListarGrupoComplementosPorProduto(int produtoId)
        {
            try
            {
                var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
                var gruposComplementos = await _complementoService.ListarGrupoComplementosPorProduto(produtoId, restauranteId);
                if (gruposComplementos == null || !gruposComplementos.Any())
                {
                    return Ok(new List<GrupoComplemento>());
                }
                return Ok(gruposComplementos);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao buscar grupos de complementos: {ex.Message}");
            }
        }

        [HttpGet]
        [Route("ListarGrupoComplementosPorLoja/{nomeDaLoja}/{produtoId}")]
        public async Task<IActionResult> ListarGrupoComplementosPorLoja(string nomeDaLoja, int produtoId)
        {
            try
            {
                var produtoGrupoComplemento = await _complementoService.ObterGrupoComplementoPorNome(nomeDaLoja, produtoId);
                if (produtoGrupoComplemento == null)
                {
                    return NotFound("Restaurante não encontrado.");
                }
                
                var gruposComplementos = await _complementoService.ListarGrupoComplementosPorProduto(produtoId, produtoGrupoComplemento.Restaurante.Id);
                if (gruposComplementos == null || !gruposComplementos.Any())
                {
                    return Ok(new List<GrupoComplemento>());
                }
                return Ok(gruposComplementos);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao buscar grupos de complementos: {ex.Message}");
            }
        }

        // Adicionar complemento ao grupo
        [HttpPost]
        [Route("AdicionarComplementoAoGrupo")]
        public async Task<IActionResult> AdicionarComplementoAoGrupo([FromBody] Dictionary<string, int> ids)
        {
            if (!ids.ContainsKey("complementoId") || !ids.ContainsKey("grupoComplementoId"))
            {
                return BadRequest("Os IDs de complemento e grupo complemento são necessários.");
            }
            int complementoId = ids["complementoId"];
            int grupoComplementoId = ids["grupoComplementoId"];
            var resultado = await _complementoService.AdicionarComplementoAoGrupo(complementoId, grupoComplementoId);
            if (resultado == null) return BadRequest("Erro ao vincular complemento a um grupo");
            return Ok(resultado);
        }

        [HttpPut]
        [Route("AtualizarGrupoComplemento")]
        public async Task<IActionResult> AtualizarGrupoComplemento([FromBody] GrupoComplemento grupoComplemento)
        {
            var grupoComplementoResult = await _complementoService.AtualizarGrupoComplemento(grupoComplemento);
            if (grupoComplementoResult == null) throw new Exception("Erro ao atualizar grupo complemento");
            return Ok(grupoComplementoResult);
        }

        [HttpDelete]
        [Route("DeletarGrupoComplemento/{id}")]
        public async Task<IActionResult> DeletarGrupoComplemento(int id)
        {
            await _complementoService.DeletarGrupoComplemento(id);
            return NoContent();
        }
    }
}
