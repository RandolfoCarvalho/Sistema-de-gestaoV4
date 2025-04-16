using Microsoft.AspNetCore.Mvc;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models.DTOs.Resquests;
using SistemaDeGestão.Models;
using SistemaDeGestão.Services.Interfaces;
using SistemaDeGestão.Services;

namespace SistemaDeGestão.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class CredenciaisMercadoPagoController : Controller
    {
        private readonly DataBaseContext _context;
        private readonly IEncryptionService _encryptionService;
        public CredenciaisMercadoPagoController(DataBaseContext context, IEncryptionService encryptionService)
        {
            _context = context;
            _encryptionService = encryptionService;
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
        [HttpPost]
        [Route("CreateCredential")]
        public async Task<IActionResult> CreateCredential([FromBody] RestauranteCredencialMercadoPagoDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var credencial = new RestauranteCredencialMercadoPago
            {
                RestauranteId = dto.RestauranteId,
                PublicKey = _encryptionService.Encrypt(dto.PublicKey),
                AccessToken = _encryptionService.Encrypt(dto.AccessToken),
                ClientId = _encryptionService.Encrypt(dto.ClientId),
                ClientSecret = _encryptionService.Encrypt(dto.ClientSecret),
                DataCadastro = DateTime.UtcNow,
                Ativo = dto.Ativo
            };

            _context.RestauranteCredenciaisMercadoPago.Add(credencial);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCredential), new { id = credencial.Id }, new
            {
                credencial.Id,
                credencial.RestauranteId,
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
