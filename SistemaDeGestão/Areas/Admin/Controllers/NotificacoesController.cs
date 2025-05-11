using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Services;
using System.Security.Claims;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/1.0/[controller]")]
    public class NotificacoesController : Controller
    {
        private readonly WhatsAppBotService _whatsAppBot;
        private readonly DataBaseContext _context;
        public NotificacoesController(WhatsAppBotService whatsAppBot, DataBaseContext context)
        {
            _whatsAppBot = whatsAppBot;
            _context = context;
        }

        [HttpGet]
        [Route("ListarMensagens")]
        public async Task<IActionResult> ListarMensagens()
        {
            var restauranteIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(restauranteIdClaim))
                return Unauthorized("Restaurante não encontrado para o usuário autenticado.");

            if (!int.TryParse(restauranteIdClaim, out var restauranteId))
                return BadRequest("ID de restaurante inválido.");

            var modelos = await _whatsAppBot.ListarMensagensAsync(restauranteId);
            return Ok(modelos);
        }

        [HttpPost]
        [Route("SalvarMensagens")]
        public async Task<IActionResult> SalvarModelo([FromBody] ModeloMensagem modelo)
        {
            Console.WriteLine("Requisição recebida no backend");
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var restauranteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (restauranteId == null)
                if (string.IsNullOrEmpty(restauranteId))
                    return BadRequest("Restaurante não identificado");

            if (restauranteId == null)
            {
                return Unauthorized("Restaurante não encontrado para o usuário autenticado.");
            }

            // Verifica se o modelo de mensagem pertence ao restaurante autenticado
            modelo.RestauranteId = int.Parse(restauranteId); // Converte o restauranteId para int (ou o tipo correto)

            var existente = await _context.ModelosMensagem
                            .Where(m => m.Id == modelo.Id && m.RestauranteId == modelo.RestauranteId) // Filtra pelo restauranteId
                            .FirstOrDefaultAsync();

            if (existente == null)
            {
                _context.ModelosMensagem.Add(modelo);
            }
            else
            {
                existente.TemplateId = modelo.TemplateId;
                existente.Titulo = modelo.Titulo;
                existente.Texto = modelo.Texto;
                existente.Etapa = modelo.Etapa;
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpPost("enviar")]
        public async Task<IActionResult> EnviarMensagem(string telefone, string mensagem)
        {
            // Garante que o número está no formato correto com @c.us
            if (!telefone.EndsWith("@c.us"))
            {
                telefone = telefone + "@c.us";
            }

            var sucesso = await _whatsAppBot.EnviarMensagemAsync("cliente1", telefone, mensagem);

            if (sucesso)
                return Ok("Mensagem enviada com sucesso!");
            else
                return StatusCode(500, "Erro ao enviar a mensagem.");
        }
    }

}
