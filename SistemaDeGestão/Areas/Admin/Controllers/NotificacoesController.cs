using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Services;
using System.Globalization;
using System.Security.Claims;
using System.Text;
using System.Globalization;

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

        [HttpGet("cliente/{telefone}")]
        public async Task<IActionResult> ObterPedidoPorTelefone(string telefone)
        {
            var pedido = await _context.Pedidos
                .Include(r => r.Restaurante)
                .Where(p => p.FinalUserTelefone.Contains(telefone))
                .OrderByDescending(p => p.DataPedido)
                .FirstOrDefaultAsync();

            if (pedido == null)
                return NotFound();

            return Ok(new
            {
                id = pedido.Id,
                nome = pedido.FinalUserName,
                numero = pedido.Numero,
                nomeDaLoja = pedido.NomeDaLoja,
                numeroDaLoja = pedido.Restaurante.PhoneNumber,
                status = pedido.Status.ToString(),
                restauranteId = pedido.RestauranteId,
                data = pedido.DataPedido,
                valor = pedido.Pagamento.ValorTotal 
            });
        }

        [HttpPost("AtivarAcompanhamento")]
        public async Task<IActionResult> AtivarAcompanhamentoAsync([FromBody] AtivarAcompanhamentoRequest request)
        {
            var pedido = await _context.Pedidos.FindAsync(request.PedidoId);
            if (pedido == null)
            {
                return NotFound(new { message = $"Pedido com ID {request.PedidoId} não encontrado." });
            }
            pedido.AcompanhamentoAtivo = true;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Acompanhamento ativado com sucesso." });
        }
        //todo fazer a mensagem retornar, tratar acentos e espacos para buscar o modelo no banco
        [Route("templates/{restauranteId}/{status}")]
        [HttpGet]
        public async Task<IActionResult> ObterTemplateMensagem(int restauranteId, string status)
        {
            string Normalize(string input)
            {
                return new string(input
                    .Normalize(NormalizationForm.FormD)
                    .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                    .ToArray()
                ).ToLowerInvariant();
            }

            var statusNormalizado = Normalize(status);

            // Busca todos os templates do restaurante na memória e filtra normalizando
            var templates = await _context.ModelosMensagem
                .Where(t => t.RestauranteId == restauranteId)
                .ToListAsync(); // Corrige o problema ao garantir que a execução ocorre no banco antes de filtrar na memória

            var template = templates.FirstOrDefault(t => Normalize(t.Etapa) == statusNormalizado);

            if (template == null)
                return NotFound();

            return Ok(new
            {
                titulo = template.Titulo,
                texto = template.Texto
            });
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
    public class AtivarAcompanhamentoRequest
    {
        public int PedidoId { get; set; }
    }

}
