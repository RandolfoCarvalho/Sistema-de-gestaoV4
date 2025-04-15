using Microsoft.AspNetCore.Mvc;
using SistemaDeGestão.Models;
using SistemaDeGestão.Services;
using System.Security.Claims;

namespace SistemaDeGestão.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class AdicionalController : Controller
    {
        private readonly AdicionalService _adicionalService;

        public AdicionalController(AdicionalService adicionalService)
        {
            _adicionalService = adicionalService;
        }

        [HttpGet]
        [Route("ListarAdicionais")]
        public async Task<IActionResult> ListarAdicionais()
        {
            return Ok(await _adicionalService.ListarAdicionais());
        }

        [HttpPost]
        [Route("CriarAdicional")]
        public async Task<IActionResult> CriarAdicional([FromBody] Adicional adicional)
        {
            if (adicional == null)
            {
                throw new ArgumentNullException(nameof(adicional), "O adicional não pode ser nulo.");
            }

            var adicionalResult = await _adicionalService.CriarAdicional(adicional);
            if (adicionalResult == null) return BadRequest("Erro ao criar adicional");
            return Ok(adicionalResult);
        }
        [HttpGet("ObterAdicionais/{produtoId}")]
        public async Task<ActionResult<List<Adicional>>> ObterAdicionais(int produtoId)
        {
            try
            {
                var adicionais = await _adicionalService.ObterAdicionaisPorProdutoId(produtoId);
                return Ok(adicionais);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpPut]
        [Route("AtualizarAdicional")]
        public async Task<IActionResult> AtualizarAdicional([FromBody] Adicional adicional)
        {
            var adicionalResult = await _adicionalService.AtualizarAdicional(adicional);
            if (adicionalResult == null) throw new Exception("Erro ao atualizar adicional");
            return Ok(adicionalResult);
        }
        [HttpDelete("DeletarAdicional/{id}")]
        public async Task<IActionResult> DeletarProduto(int id)
        {
            await _adicionalService.DeletarAdicional(id);
            return NoContent();
        }

        //-------------------------------------------------------------------------------//
        // Grupos adicionais

        [HttpGet]
        [Route("ListarGrupoAdicionaisAtivosEInativos")]
        public async Task<IActionResult> ListarGrupoAdicionaisAtivosEInativos()
        {
            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            return Ok(await _adicionalService.ListarGrupoAdicionaisAtivosEInativos(restauranteId));
        }
        [HttpGet]
        [Route("ListarGrupoAdicionais")]
        public async Task<IActionResult> ListarGrupoAdicionais()
        {
            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            return Ok(await _adicionalService.ListarGrupoAdicionais(restauranteId));
        }

        [HttpGet]
        [Route("ListarGrupoAdicionais/{id}")]
        public async Task<IActionResult> ListarGrupoAdicionaisPorId(int id)
        {
            var grupoAdicional = await _adicionalService.ListarGrupoAdicionalPorId(id);
            if (grupoAdicional == null)
            {
                return NotFound("Grupo de adicionais não encontrado.");
            }
            return Ok(grupoAdicional);
        }

        [HttpGet]
        [Route("ListarGrupoAdicionaisPorProduto/{produtoId}")]
        public async Task<IActionResult> ListarGrupoAdicionaisPorProduto(int produtoId)
        {
            try
            {
                var gruposAdicionais = await _adicionalService.ListarGruposAdicionaisPorProduto(produtoId);
                if (gruposAdicionais == null || !gruposAdicionais.Any())
                {
                    return Ok(new List<GrupoAdicional>());
                }
                return Ok(gruposAdicionais);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao buscar grupos de adicionais: {ex.Message}");
            }
        }

        [HttpGet]
        [Route("ListarGrupoAdicionaisPorLoja/{nomeDaLoja}/{produtoId}")]
        public async Task<IActionResult> ListarGrupoComplementosPorLoja(string nomeDaLoja, int produtoId)
        {
            try
            {
                var produtoGrupoAdicionais = await _adicionalService.ObterGrupoComplementoPorNome(nomeDaLoja, produtoId);
                if (produtoGrupoAdicionais == null)
                {
                    return NotFound("Restaurante não encontrado.");
                }

                var gruposAdicionais = await _adicionalService.ListarGrupoAdicionaisPorProduto(produtoId, produtoGrupoAdicionais.Restaurante.Id);
                if (gruposAdicionais == null || !gruposAdicionais.Any())
                {
                    return Ok(new List<GrupoAdicional>()); 
                }
                return Ok(gruposAdicionais);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao buscar grupos de complementos: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("CriarGrupoAdicional")]
        public async Task<IActionResult> CriarGrupoAdicional([FromBody][Bind("Nome", "Ativo", "LimiteSelecao", "Adicionais")] GrupoAdicional grupoAdicional)
        {
            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));
            grupoAdicional.RestauranteId = restauranteId;
            try
            {
                var result = await _adicionalService.CriarGrupoAdicional(grupoAdicional);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao criar grupo adicional: {ex.Message}");
            }
        }


        [HttpPost]
        [Route("AdicionarAdicionalAoGrupo")]
        public async Task<IActionResult> AdicionarAdicionalAoGrupo([FromBody] Dictionary<string, int> ids)
        {
            if (!ids.ContainsKey("adicionalId") || !ids.ContainsKey("grupoAdicionalId"))
            {
                return BadRequest("Os IDs de adicional e grupo adicional são necessários.");
            }

            int adicionalId = ids["adicionalId"];
            int grupoAdicionalId = ids["grupoAdicionalId"];

            var resultado = await _adicionalService.AdicionarAdicionalAoGrupo(adicionalId, grupoAdicionalId);
            if (resultado == null) return BadRequest("Erro ao vincular adicional a um grupo");
            return Ok(resultado);
        }

        [HttpPut]
        [Route("AtualizarGrupoAdicional")]
        public async Task<IActionResult> AtualizarGrupoAdicional([FromBody] GrupoAdicional grupoAdicional)
        {
            var grupoAdicionalResult = await _adicionalService.AtualizarGrupoAdicional(grupoAdicional);
            if (grupoAdicionalResult == null) throw new Exception("Erro ao atualizar grupo adicional");
            return Ok(grupoAdicionalResult);
        }

        [HttpDelete]
        [Route("DeletarGrupoAdicional/{id}")]
        public async Task<IActionResult> DeletarGrupoAdicional(int id)
        {
            await _adicionalService.DeletarGrupoAdicional(id);
            return NoContent();
        }
    }
}