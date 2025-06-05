using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Services;
using SistemaDeGestao.Services.Interfaces;
using System.Security.Claims;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class RestauranteController : Controller
    {
        private readonly DataBaseContext _context;
        private readonly RestauranteService _restauranteService;
        private readonly IEncryptionService _encryptionService;
        public RestauranteController(DataBaseContext context, RestauranteService restauranteService,
            IEncryptionService encryptionService, IAmazonS3 s3Client)
        {
            _context = context;
            _restauranteService = restauranteService;
            _encryptionService = encryptionService;
            
        }
        [HttpGet]
        public IActionResult list()
        {
            return Ok(_context.Restaurantes.ToList());
        }

        [HttpPost]
        [Route("Cadastro")]
        public async Task<IActionResult> CriarUsuario([FromBody] Restaurante Restaurante)
        {
            try
            {
               await _restauranteService.CriarUsuarioAsync(Restaurante);
            }
            catch (Exception ex)
            {
                throw new Exception($"{ex.InnerException?.Message ?? ex.Message}");
            }

            return Ok(Restaurante);
        }

        [HttpGet("isLojaOpen/{restauranteId}")]
        public IActionResult IsLojaOpen(int restauranteId)
        {
            var empresa = _context.Empresas
                .Include(e => e.DiasFuncionamento)
                .FirstOrDefault(e => e.RestauranteId == restauranteId);
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

            var restauranteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(restauranteId))
            {
                return Unauthorized("ID do usuário não encontrado");
            }

            var restauranteModel = await _context.Restaurantes
                .Include(r => r.Empresa)
                .Include(e => e.Empresa.DiasFuncionamento)
                .FirstOrDefaultAsync(u => u.Id.ToString() == restauranteId);

            if (restauranteModel == null)
            {
                return BadRequest("Usuário não encontrado");
            }

            // Busca a credencial relacionada ao restaurante
            var credencial = await _context.RestauranteCredenciaisMercadoPago
                .FirstOrDefaultAsync(c => c.RestauranteId.ToString() == restauranteId);

            RestauranteCredencialMercadoPagoDTO credencialDTO = null;

            if (credencial != null)
            {
                credencialDTO = new RestauranteCredencialMercadoPagoDTO
                {
                    RestauranteId = credencial.RestauranteId,
                    PublicKey = _encryptionService.Decrypt(credencial.PublicKey),
                    AccessToken = _encryptionService.Decrypt(credencial.AccessToken),
                    ClientId = _encryptionService.Decrypt(credencial.ClientId),
                    ClientSecret = _encryptionService.Decrypt(credencial.ClientSecret),
                    Ativo = credencial.Ativo
                };
            }

            return Ok(new
            {
                Restaurante = restauranteModel,
                CredenciaisMercadoPago = credencialDTO
            });
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

        [HttpPut("UpdateProfileComImagem")]
        public async Task<IActionResult> UpdateProfileComImagem([FromForm] IFormFile imagemLoja, [FromForm] string restauranteJson)
        {
            var updatedRestaurante = JsonConvert.DeserializeObject<Restaurante>(restauranteJson);
            if (updatedRestaurante == null)
                return BadRequest("Dados inválidos.");
            var restauranteExistente = await _context.Restaurantes
                .Include(r => r.Empresa)
                .ThenInclude(e => e.DiasFuncionamento)
                .FirstOrDefaultAsync(r => r.Id == updatedRestaurante.Id);
            if (restauranteExistente == null)
                return NotFound("Restaurante não encontrado.");
            if (imagemLoja != null)
            {
                var novaImagemUrl = await _restauranteService.UploadImagemParaS3(imagemLoja, updatedRestaurante.NomeDaLoja, restauranteExistente.ImagemUrl);
                restauranteExistente.ImagemUrl = novaImagemUrl;
            }
            try
            {
                await _restauranteService.UpdateProfileAsync(restauranteExistente, updatedRestaurante);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
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
