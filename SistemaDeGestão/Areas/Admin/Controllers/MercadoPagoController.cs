using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using SistemaDeGestao.Models.DTOs.Resquests;
using System;
using System.Text.Json;
using System.Threading.Tasks;
using SistemaDeGestao.Data;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Interfaces;
using System.Text;
using SistemaDeGestao.Hubs;
using Microsoft.AspNetCore.SignalR;
using SistemaDeGestao.Services;
using SistemaDeGestao.Models;

namespace SistemaDeGestao.Controllers
{
    [ApiController]
    [Route("api/1.0/[controller]")]
    public class MercadoPagoController : ControllerBase
    {
        private readonly IPagamentoOrchestratorService _orchestrator;
        private readonly ILogger<MercadoPagoController> _logger;
        private readonly IHubContext<PagamentoPixHub> _hubContext;
        private readonly DataBaseContext _context;

        public MercadoPagoController(
            IPagamentoOrchestratorService orchestrator,
            ILogger<MercadoPagoController> logger,
            DataBaseContext context, 
            IHubContext<PagamentoPixHub> hubContext)
        {
            _orchestrator = orchestrator;
            _logger = logger;
            _context = context;
            _hubContext = hubContext;
        }

        [HttpPost]
        [Route("processaPagamentoPix")]
        public async Task<IActionResult> ProcessaPagamentoPix([FromBody] PagamentoRequestPix request)
        {
            if (request?.DadosPagamento == null || request?.PedidoDTO == null)
                return BadRequest("Dados incompletos.");

            try
            {
                var resultado = await _orchestrator.IniciarPagamentoPixAsync(request);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar pagamento PIX no controller.");
                return StatusCode(500, new { message = $"Erro ao processar pagamento: {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("processaPagamento")]
        public async Task<IActionResult> ProcessaPagamento([FromBody] PagamentoRequest request)
        {
            if (request?.DadosPagamento == null || request?.PedidoDTO == null)
                return BadRequest("Dados incompletos.");
            try
            {
                var paymentResponse = await _orchestrator.IniciarPagamentoCartaoAsync(request);
                return Ok(paymentResponse);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar pagamento por cartão no controller.");
                return BadRequest(new { message = $"Erro ao processar pagamento por cartão: {ex.Message}" });
            }
        }

        [HttpPost]
        [Route("processaPagamentoDinheiro")]
        public async Task<IActionResult> ProcessaPagamentoDinheiro([FromBody] PagamentoRequestDinheiro request)
        {
            if (request?.DadosPagamento == null || request?.PedidoDTO?.FinalUserTelefone == null)
                return BadRequest(new { status = "bad_request", message = "Informações do pedido incompletas." });

            try
            {
                var response = await _orchestrator.ProcessarPagamentoDinheiroAsync(request);
                return Ok(response);
            }
            catch (InvalidOperationException ex)
            {
                return StatusCode(429, new { status = "rate_limited", message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar pagamento em dinheiro.");
                return StatusCode(500, new { status = "error", message = $"Erro: {ex.Message}" });
            }
        }

        [HttpPost("processaReembolso")]
        public async Task<IActionResult> ProcessaReembolso([FromBody] ReembolsoRequest request)
        {
            try
            {
                var resultado = await _orchestrator.ProcessarReembolsoAsync(request);
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar reembolso.");
                return StatusCode(500, new { message = $"Erro ao processar reembolso: {ex.Message}" });
            }
        }

        [AllowAnonymous]
        [HttpGet]
        [Route("ObterPagamentoAsync/{pagamentoId}/{restauranteId}")]
        public async Task<IActionResult> ObterPagamentoAsync(long pagamentoId, int restauranteId)
        {
            try
            {
                var result = await _orchestrator.ObterStatusPagamentoClienteAsync(pagamentoId, restauranteId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao obter status de pagamento para {PagamentoId}", pagamentoId);
                return StatusCode(500, new { status = "error", message = ex.Message });
            }
        }

        [HttpPost]
        [Route("notificacao")]
        [AllowAnonymous]
        public async Task<IActionResult> ReceberNotificacao([FromBody] NotificacaoMercadoPago payload)
        {
            _logger.LogInformation("Webhook recebido. Tipo: {Type}, ID do Dado: {DataId}", payload?.Type, payload?.Data?.Id);

            if (payload?.Type != "payment" || string.IsNullOrEmpty(payload.Data?.Id))
            {
                _logger.LogWarning("Webhook ignorado: tipo não é 'payment' ou ID está ausente.");
                return Ok("Notificação recebida mas não é de pagamento ou falta ID.");
            }

            var transactionId = payload.Data.Id;

            try
            {
                var resultadoProcessamento = await _orchestrator.ProcessarNotificacaoPixWebhookAsync(transactionId);

                if (resultadoProcessamento.Sucesso)
                {
                    _logger.LogInformation("Notificação para TransactionId {TransactionId} processada. Pagamento aprovado. Enviando notificação via SignalR.", transactionId);

                    await _hubContext.Clients.Group(transactionId).SendAsync("PagamentoAprovado", new
                    {
                        message = "Pagamento aprovado com sucesso!",
                        pedido = resultadoProcessamento.Pedido
                    });
                }
                else
                {
                    _logger.LogWarning("Processamento do webhook para o TransactionId {TransactionId} não resultou em aprovação. Motivo: {Motivo}", transactionId, resultadoProcessamento.Mensagem);
                }

                return Ok("Notificação processada.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro crítico ao processar webhook para a transação {TransactionId}", transactionId);
                return StatusCode(500, new { message = "Erro interno ao processar a notificação." });
            }
        }

        [HttpPost]
        [Route("notificacaoMercadoPago")]
        [AllowAnonymous]
        public async Task<IActionResult> ReceiveMercadoPagoWebhook()
        {
            // Vamos ler o corpo da requisição manualmente
            string rawJsonBody;
            using (var reader = new StreamReader(Request.Body, Encoding.UTF8))
            {
                rawJsonBody = await reader.ReadToEndAsync();
            }

            // Logamos tudo que temos: query string e corpo
            _logger.LogInformation("Recebida notificação do Mercado Pago. QueryString: {Query}, RawBody: {RawBody}",
                Request.QueryString.Value, rawJsonBody);

            // Agora, usamos um método auxiliar para extrair o ID de qualquer lugar possível
            var transactionId = ObterTransactionIdDaRequisicao(Request, rawJsonBody);

            if (string.IsNullOrEmpty(transactionId))
            {
                _logger.LogWarning("ID de pagamento não encontrado na notificação. Ignorando.");
                // Retorna OK para o MP não continuar reenviando uma notificação inválida.
                return Ok("ID de pagamento não encontrado, mas notificação recebida.");
            }

            try
            {
                await _orchestrator.ProcessarNotificacaoWebhookAsync(transactionId);
                _logger.LogInformation("Notificação para TransactionId {TransactionId} processada com sucesso.", transactionId);
                return Ok("Notificação processada.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar webhook para a transação {TransactionId}", transactionId);
                return StatusCode(500, new { message = "Erro interno ao processar a notificação." });
            }
        }

        [HttpGet]
        [Route("statusPagamento")]
        [AllowAnonymous]
        public async Task<IActionResult> VerificarStatusPagamento([FromQuery] string transactionId)
        {
            if (string.IsNullOrEmpty(transactionId))
                return BadRequest("TransactionId é obrigatório.");

            try
            {
                var result = await _orchestrator.VerificarStatusPagamentoPollingAsync(transactionId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao verificar status do pagamento {TransactionId}", transactionId);
                return StatusCode(500, new { status = "error", message = ex.Message });
            }
        }

        [HttpPost]
        [Route("buscarTransactionId/{id}")]
        public async Task<IActionResult> GetTransactionId(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Pagamento)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null || pedido.Pagamento == null)
                return NotFound("Pedido ou pagamento não encontrado");

            return Ok(pedido);
        }

        // Método auxiliar robusto para extrair o ID de qualquer formato de notificação
        private string? ObterTransactionIdDaRequisicao(HttpRequest request, string jsonBody)
        {
            // Prioridade 1: Query param simples como 'id' ou 'ID'
            if (request.Query.TryGetValue("id", out var idFromQuery) || request.Query.TryGetValue("ID", out idFromQuery))
            {
                return idFromQuery.FirstOrDefault();
            }

            // Prioridade 2: Query param no formato 'data.id'
            if (request.Query.TryGetValue("data.id", out var dataIdFromQuery))
            {
                return dataIdFromQuery.FirstOrDefault();
            }

            // Prioridade 3: Ler do corpo JSON, se ele não for vazio
            if (!string.IsNullOrEmpty(jsonBody))
            {
                try
                {
                    using var jsonDoc = JsonDocument.Parse(jsonBody);
                    var root = jsonDoc.RootElement;

                    // Tenta pegar de "data.id"
                    if (root.TryGetProperty("data", out var dataElement) && dataElement.TryGetProperty("id", out var idElement))
                    {
                        return idElement.GetString();
                    }

                    // Tenta pegar de "id" na raiz do objeto
                    if (root.TryGetProperty("id", out var rootIdElement))
                    {
                        return rootIdElement.ValueKind == JsonValueKind.Number
                            ? rootIdElement.GetInt64().ToString()
                            : rootIdElement.GetString();
                    }
                }
                catch (JsonException ex)
                {
                    _logger.LogWarning(ex, "Não foi possível parsear o corpo do webhook como JSON.");
                }
            }
            return null;
        }
    }
}

public class ReembolsoRequest
    {
        public long TransactionId { get; set; }
        public decimal? Amount { get; set; }
        public int RestauranteId { get; set; }
    }
    public class PagamentoRequestDinheiro
    {
        public PagamentoDinheiroDTO DadosPagamento { get; set; }
        public PedidoDTO PedidoDTO { get; set; }
    }
    public class PagamentoRequest
    {
        public PagamentoCartaoDTO? DadosPagamento { get; set; }
        public PedidoDTO? PedidoDTO { get; set; }
    }

    public class PagamentoRequestPix
    {
        public PagamentoPixDTO DadosPagamento { get; set; }
        public PedidoDTO PedidoDTO { get; set; }
    }

    public class DeviceIdDTO
    {
        public string DeviceId { get; set; }
        public string IpAddress { get; set; }
        public string UserAgent { get; set; }
    }


    public class WebhookNotificationDTO
    {
        public long Id { get; set; }
        public bool LiveMode { get; set; }
        public string Type { get; set; }
        public DateTime DateCreated { get; set; }
        public long UserId { get; set; }
        public string ApiVersion { get; set; }
        public string Action { get; set; }
        public WebhookData Data { get; set; }
    }
    public class WebhookData
    {
        public string Id { get; set; }
    }
    public class NotificacaoMercadoPago
    {
        public string Type { get; set; }
        public NotificationData Data { get; set; }
    }

    public class NotificationData
    {
        public string Id { get; set; }
    }
    public class WebhookProcessamentoResult
    {
        public bool Sucesso { get; set; }
        public string Mensagem { get; set; }
        public Pedido Pedido { get; set; } // A entidade Pedido, não o DTO
    }

