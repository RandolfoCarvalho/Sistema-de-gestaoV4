using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models;
using SistemaDeGestão.Services;
using System.Security.Claims;

namespace SistemaDeGestão.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class RestauranteController : Controller
    {
        private readonly DataBaseContext _context;
        private readonly RestauranteService _restauranteService;
        public RestauranteController(DataBaseContext context, RestauranteService restauranteService)
        {
            _context = context;
            _restauranteService = restauranteService;
        }
        public IActionResult list()
        {
            return Ok(_context.Restaurantes.ToList());
        }

        [Route("Cadastro")]
        [HttpPost]
        public async Task<IActionResult> CriarUsuario([FromBody] Restaurante Restaurante)
        {
            try
            {
               await _restauranteService.CriarUsuarioAsync(Restaurante);
            }
            catch (Exception ex)
            {
                throw new Exception($"Erro ao criar novo usuário: {ex.InnerException?.Message ?? ex.Message}");
            }

            return Ok(Restaurante);
        }

        [HttpGet("isLojaOpen/{restauranteId}")]
        public IActionResult IsLojaOpen(int restauranteId)
        {
            var empresa = _context.Empresas.FirstOrDefault(e => e.RestauranteId == restauranteId);
            if (empresa == null) return NotFound(new { message = "Empresa não encontrada" });

            bool isOpen = _restauranteService.IsLojaOpen(empresa);
            return Ok(new { isOpen });
        }

        [HttpGet]
        [Route("GetRestauranteInfo")]
        public async Task<IActionResult> GetRestauranteInfo()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Unauthorized("Usuário não está autenticado");
            }

            var RestauranteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(RestauranteId))
            {
                return Unauthorized("ID do usuário não encontrado");
            }

            var RestauranteModel = await _context.Restaurantes
                .Include(r => r.Empresa) 
                .FirstOrDefaultAsync(u => u.Id.ToString() == RestauranteId);

            if (RestauranteModel == null)
            {
                return BadRequest("Usuário não encontrado");
            }

            return Ok(RestauranteModel);
        }
        [HttpGet]
        [Route("GetRestauranteInfoByName/{RestauranteName}")]
        public async Task<IActionResult> GetRestauranteInfoByName(string RestauranteName)
        {
            var RestauranteModel = await _context.Restaurantes
                .Include(r => r.Empresa)
                .FirstOrDefaultAsync(u => u.NomeDaLoja == RestauranteName);

            if (RestauranteModel == null)
            {
                return BadRequest("Usuário não encontrado");
            }
            return Ok(RestauranteModel);
        }

        [HttpPut("UpdateProfile")]
        public async Task<IActionResult> UpdateProfile([FromBody] Restaurante updatedRestaurante)
        {
            var restaurante = await _restauranteService.GetRestauranteByUserIdAsync(User);
            if (restaurante == null)
                return BadRequest("Usuário não encontrado");
            bool updated = await _restauranteService.UpdateProfileAsync(restaurante, updatedRestaurante);
            if (!updated)
                return StatusCode(500, "Erro ao atualizar perfil");
            return Ok("Perfil atualizado com sucesso");
        }

        [HttpGet]
        [Route("ObterRestauranteIdDoUsuarioAutenticado")]
        public IActionResult ObterRestauranteIdDoUsuarioAutenticado()
        {
            var restauranteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(restauranteId, out var restId))
            {
                return Ok(restauranteId);
            }
            return BadRequest("Usuario nao autenticado ou não encontrado");
        }

        [HttpGet("BuscarRestauranteIdPorNome/{nomeLoja}")]
        public async Task<ActionResult<int>> BuscarRestauranteIdPorNome(string nomeLoja)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(nomeLoja))
                {
                    return BadRequest("Nome da loja não pode ser vazio.");
                }
                var nomeLojaLower = nomeLoja.Trim().ToLower();
                var restaurante = await _context.Restaurantes
                    .Where(r => r.NomeDaLoja != null &&
                               r.NomeDaLoja.ToLower().Equals(nomeLojaLower))
                    .FirstOrDefaultAsync();

                if (restaurante == null)
                {
                    return NotFound($"Restaurante '{nomeLoja}' não encontrado.");
                }

                return Ok(restaurante.Id);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro interno ao buscar restaurante.");
            }
        }

    }
}
