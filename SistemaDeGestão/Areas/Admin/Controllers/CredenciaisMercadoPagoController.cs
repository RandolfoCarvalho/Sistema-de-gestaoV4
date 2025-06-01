using Microsoft.AspNetCore.Mvc;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Models;
using SistemaDeGestao.Services.Interfaces;
using SistemaDeGestao.Services;
using System.Security.Claims;
using Microsoft.EntityFrameworkCore;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class CredenciaisMercadoPagoController : Controller
    {
        private readonly DataBaseContext _context;
        private readonly IEncryptionService _encryptionService;
        private readonly RestauranteService _restauranteService;
        public CredenciaisMercadoPagoController(DataBaseContext context, IEncryptionService encryptionService
            ,RestauranteService restauranteService)
        {
            _context = context;
            _encryptionService = encryptionService;
            _restauranteService = restauranteService;
        }

        [HttpGet]
        [Route("GetCredential/{id}")]
        public async Task<IActionResult> GetCredential(int id)
        {
            var credencial = await _context.RestauranteCredenciaisMercadoPago.FindAsync(id);

            if (credencial == null)
                return NotFound();

            var dto = new RestauranteCredencialMercadoPagoDTO
            {
                RestauranteId = credencial.RestauranteId,
                PublicKey = _encryptionService.Decrypt(credencial.PublicKey),
                AccessToken = _encryptionService.Decrypt(credencial.AccessToken),
                ClientId = _encryptionService.Decrypt(credencial.ClientId),
                ClientSecret = _encryptionService.Decrypt(credencial.ClientSecret),
                Ativo = credencial.Ativo
            };

            return Ok(dto);
        }

        [HttpGet]
        [Route("GetCredentialByRestauranteId/{restauranteId}")]
        public async Task<IActionResult> GetCredentialByRestauranteId(int restauranteId)
        {
            var credencial = await _context.RestauranteCredenciaisMercadoPago
                .FirstOrDefaultAsync(c => c.RestauranteId == restauranteId && c.Ativo);

            if (credencial == null)
                return NotFound();

            var dto = new RestauranteCredencialMercadoPagoDTO
            {
                RestauranteId = credencial.RestauranteId,
                PublicKey = _encryptionService.Decrypt(credencial.PublicKey),
                AccessToken = _encryptionService.Decrypt(credencial.AccessToken),
                ClientId = _encryptionService.Decrypt(credencial.ClientId),
                ClientSecret = _encryptionService.Decrypt(credencial.ClientSecret),
                Ativo = credencial.Ativo
            };

            return Ok(dto);
        }
        [HttpPost]
        [Route("CreateCredential")]
        public async Task<IActionResult> CreateCredential([FromBody] RestauranteCredencialMercadoPagoDTO dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var restauranteId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

            var credencialExistente = await _context.RestauranteCredenciaisMercadoPago
                .FirstOrDefaultAsync(c => c.RestauranteId == restauranteId);

            if (credencialExistente != null)
            {
                // Atualiza a credencial existente
                credencialExistente.PublicKey = _encryptionService.Encrypt(dto.PublicKey);
                credencialExistente.AccessToken = _encryptionService.Encrypt(dto.AccessToken);
                credencialExistente.ClientId = _encryptionService.Encrypt(dto.ClientId);
                credencialExistente.ClientSecret = _encryptionService.Encrypt(dto.ClientSecret);
                credencialExistente.Ativo = dto.Ativo;

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    credencialExistente.Id,
                    credencialExistente.RestauranteId,
                    Message = "Credencial atualizada com sucesso."
                });
            }

            // Cria nova credencial
            var novaCredencial = new RestauranteCredencialMercadoPago
            {
                RestauranteId = restauranteId,
                PublicKey = _encryptionService.Encrypt(dto.PublicKey),
                AccessToken = _encryptionService.Encrypt(dto.AccessToken),
                ClientId = _encryptionService.Encrypt(dto.ClientId),
                ClientSecret = _encryptionService.Encrypt(dto.ClientSecret),
                Ativo = dto.Ativo,
                DataCadastro = DateTime.UtcNow
            };

            _context.RestauranteCredenciaisMercadoPago.Add(novaCredencial);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCredential), new { id = novaCredencial.Id }, new
            {
                novaCredencial.Id,
                novaCredencial.RestauranteId,
                Message = "Credencial criada com sucesso."
            });
        }

        [HttpPut]
        [Route("UpdateCredential/{id}")]
        public async Task<IActionResult> UpdateCredential(int id, [FromBody] RestauranteCredencialMercadoPagoDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var credencial = await _context.RestauranteCredenciaisMercadoPago.FindAsync(id);
            if (credencial == null)
                return NotFound();

            // Atualizando as credenciais
            credencial.PublicKey = _encryptionService.Encrypt(dto.PublicKey);
            credencial.AccessToken = _encryptionService.Encrypt(dto.AccessToken);
            credencial.ClientId = _encryptionService.Encrypt(dto.ClientId);
            credencial.ClientSecret = _encryptionService.Encrypt(dto.ClientSecret);
            credencial.Ativo = dto.Ativo;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Credencial atualizada com sucesso." });
        }
        [HttpDelete]
        [Route("DeleteCredential/{id}")]
        public async Task<IActionResult> DeleteCredential(int id)
        {
            var credencial = await _context.RestauranteCredenciaisMercadoPago.FindAsync(id);
            if (credencial == null)
                return NotFound();

            _context.RestauranteCredenciaisMercadoPago.Remove(credencial);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Credencial deletada com sucesso." });
        }

    }
}
