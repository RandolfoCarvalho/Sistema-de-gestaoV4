using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Amazon.Runtime.Internal;
using Azure.Core;
using MercadoPago.Http;
using MercadoPago.Resource.Payment;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Services;
using SistemaDeGestao.Services.Interfaces;

namespace SistemaDeGestao.Controllers
{
    [Route("api/1.0/[controller]")]
    public class MercadoPagoController : Controller
    {
        private readonly MercadoPagoService _paymentService;
        private readonly IConfiguration _configuration;
        private readonly DataBaseContext _context;
        private readonly PedidoService _pedidoService;
        private readonly IHubContext<OrderHub> _hubContext;
        private readonly IEncryptionService _encryptionService;
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
        private readonly ILogger<MercadoPagoController> _logger;
        public MercadoPagoController(MercadoPagoService paymentService, IConfiguration configuration,
            DataBaseContext context, PedidoService pedidoService, IHubContext<OrderHub> hubContext, IEncryptionService encryptionService, ILogger<MercadoPagoController> logger)
        {
            _paymentService = paymentService;
            _configuration = configuration;
            _context = context;
            _pedidoService = pedidoService;
            _hubContext = hubContext;
            _encryptionService = encryptionService;
            _logger = logger;
        }

        [HttpPost]
        [Route("processaPagamentoPix")]
        public async Task<IActionResult> ProcessaPagamentoPix([FromBody] PagamentoRequestPix request)
        {
            if (request?.DadosPagamento == null || request?.PedidoDTO == null)
                return BadRequest("Dados incompletos.");

            var accessToken = await BuscaCredenciaisAsync(request.PedidoDTO.RestauranteId);
            var resultado = await _paymentService.ProcessarPixAsync(request.DadosPagamento, request.PedidoDTO, accessToken.ToString());
            return Ok(resultado);
        }

        [HttpPost]
        [Route("processaPagamento")]
        public async Task<IActionResult> ProcessaPagamento([FromBody] PagamentoRequest request)
        {
            try
            {
                var accessToken = await BuscaCredenciaisAsync(request.PedidoDTO.RestauranteId);
                var paymentResponse = await _paymentService.ProcessPayment(request.DadosPagamento, request.PedidoDTO, accessToken.ToString());
                return Ok(paymentResponse);

            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao processar pagamento por cartão: " + ex.Message);
            }
        }

        [HttpPost("processaReembolso")]
        public async Task<IActionResult> ProcessaReembolso([FromBody] ReembolsoRequest request)
        { 
            var accessToken = await BuscaCredenciaisAsync(request.RestauranteId);
            var resultado = await _paymentService.ProcessarReembolso(request, accessToken);
            return Ok(resultado);
        }

        [AllowAnonymous]
        [HttpGet]
        [Route("ObterPagamentoAsync/{pagamentoId}/{restauranteId}")]

        public async Task<IActionResult> ObterPagamentoAsync(long pagamentoId, int restauranteId)
        {
            try
            {
                HttpClient httpClient = new HttpClient();
                var accessToken = await BuscaCredenciaisAsync(restauranteId);
                httpClient.BaseAddress = new Uri("https://api.mercadopago.com/v1/payments/");
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                var response = await httpClient.GetAsync(pagamentoId.ToString());
                response.EnsureSuccessStatusCode();
                var content = await response.Content.ReadAsStringAsync();
                var paymentData = JsonDocument.Parse(content).RootElement;
                if (!paymentData.TryGetProperty("status", out var statusElement))
                {
                    return BadRequest("Status de pagamento não encontrado.");
                }
                string status = statusElement.GetString();
                if(status == "approved")
                {
                    var pedido = await _context.Pedidos.FirstOrDefaultAsync(p => p.Pagamento.TransactionId == pagamentoId.ToString());
                    if (pedido != null) return Ok("Pedido ja existe");

                    var pedidoPendente = await _context.PedidosPendentes
                        .FirstOrDefaultAsync(p => p.TransactionId == pagamentoId.ToString());
                    if (pedidoPendente == null) return NotFound("Pedido pendente não encontrado.");
                    var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                    pedidoDTO.Pagamento.TransactionId = pagamentoId.ToString();
                    await _pedidoService.CriarPedidoAsync(pedidoDTO);
                    await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", pedidoDTO);
                    _context.PedidosPendentes.Remove(pedidoPendente);
                    await _context.SaveChangesAsync();
                    return Ok(new { status = "approved" });
                }
                return Ok(new { status });
            }
            catch (HttpRequestException ex)
            {
                throw new Exception($"Erro na requisição: {ex.Message}");
            }
        }

        [HttpPost]
        [Route("notificacaoMercadoPago")]
        public async Task<IActionResult> ReceiveMercadoPagoWebhook(
         [FromBody] JsonElement notification,
         [FromQuery] string id,
         [FromQuery] string topic,
         [FromQuery] string type)
        {
            try
            {
                var transactionId = ObterTransactionId(notification, id, type);
                if (string.IsNullOrEmpty(transactionId))
                    return BadRequest("ID de pagamento não encontrado.");

                _logger.LogInformation("Processando notificação do Mercado Pago. TransactionId: {TransactionId}", transactionId);

                var pedidoPendente = await TentarObterPedidoPendenteAsync(transactionId, maxTentativas: 15, delayMs: 200);
                if (pedidoPendente == null)
                {
                    _logger.LogWarning("Pedido pendente não encontrado para TransactionId: {TransactionId}", transactionId);
                    return NotFound("Pedido pendente não encontrado.");
                }

                var pedidoExistente = await _context.Pedidos
                    .AsNoTracking()
                    .AnyAsync(p => p.Pagamento.TransactionId == transactionId);

                if (pedidoExistente)
                {
                    _logger.LogInformation("Pedido com TransactionId {TransactionId} já existe.", transactionId);
                    return Ok("Pedido já existe");
                }

                var dados = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                if (dados?.RestauranteId is null or 0)
                    return BadRequest("RestauranteId não encontrado.");

                var accessToken = await BuscaCredenciaisAsync(dados.RestauranteId);
                var statusPagamento = await ObterStatusPagamentoAsync(transactionId, accessToken);

                if (statusPagamento == "approved")
                {
                    await ProcessarPagamentoAprovadoAsync(transactionId);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar notificação do Mercado Pago");
                return StatusCode(500, $"Erro ao processar notificação: {ex.Message}");
            }
        }

        //TODO - fazer o pooling do pagamento para pix
        [HttpGet("statusPagamento")]
        public async Task<IActionResult> VerificarStatusPagamento([FromQuery] string transactionId)
        {
            var pedido = await _context.Pedidos.FirstOrDefaultAsync(p => p.Pagamento.TransactionId == transactionId);
            if (pedido == null) return NotFound("Pedido não encontrado.");
            return Ok(new { status = "approved" });
        }

        [HttpPost]
        [Route("buscarTransactionId/{id}")]
        public async Task<IActionResult> GetTransactionId(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Pagamento)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null || pedido.Pagamento == null)
                return NotFound("Pedido ou pagamento não encontrado");

            return Ok(pedido);
        }

        private async Task<string> BuscaCredenciaisAsync(int restauranteId)
        {
            var credencial = await _context.RestauranteCredenciaisMercadoPago
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.RestauranteId == restauranteId && c.Ativo);

            if (credencial == null)
                throw new Exception("Credencial do Mercado Pago não encontrada ou inativa.");

            var accessToken = _encryptionService.Decrypt(credencial.AccessToken);
            return accessToken;
        }

        private async Task ProcessarPagamentoAprovadoAsync(string transactionId)
        {
            var semaphore = _locks.GetOrAdd(transactionId, _ => new SemaphoreSlim(1, 1));

            await semaphore.WaitAsync();
            try
            {
                var pedidoPendente = await _context.PedidosPendentes
                    .FirstOrDefaultAsync(p => p.TransactionId == transactionId);
                if (pedidoPendente == null) return;
                var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                pedidoDTO.Pagamento.TransactionId = transactionId;
                await _pedidoService.CriarPedidoAsync(pedidoDTO);
                await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", pedidoDTO);
                _context.PedidosPendentes.Remove(pedidoPendente);
                await _context.SaveChangesAsync();
            } catch(Exception ex)
            {
                throw new Exception(ex.Message + " <- Nova mensagem de erro: ");
            }
            finally
            {
                semaphore.Release();
                _ = Task.Delay(4000).ContinueWith(t => _locks.TryRemove(transactionId, out _));
            }
        }
        private string? ObterTransactionId(JsonElement notification, string id, string type)
        {
            if (!string.IsNullOrEmpty(id))
                return id;

            if (notification.TryGetProperty("data", out var data) &&
                data.TryGetProperty("id", out var idElement))
                return idElement.GetString();

            if (type == "payment" && Request.Query.TryGetValue("data.id", out var dataIdValues))
                return dataIdValues.FirstOrDefault();

            return null;
        }

        private async Task<PedidoPendente?> TentarObterPedidoPendenteAsync(string transactionId, int maxTentativas, int delayMs)
        {
            for (int tentativa = 0; tentativa < maxTentativas; tentativa++)
            {
                var pedido = await _context.PedidosPendentes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TransactionId == transactionId);

                if (pedido != null)
                    return pedido;

                await Task.Delay(delayMs);
            }
            return null;
        }

        private async Task<string?> ObterStatusPagamentoAsync(string transactionId, string accessToken)
        {
            var url = $"https://api.mercadopago.com/v1/payments/{transactionId}?access_token={accessToken}";
            using var client = new HttpClient();

            var response = await client.GetAsync(url);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Falha ao obter status do pagamento para {TransactionId}. StatusCode: {StatusCode}", transactionId, response.StatusCode);
                return null;
            }

            var json = await response.Content.ReadAsStringAsync();
            var doc = JsonDocument.Parse(json);

            if (doc.RootElement.TryGetProperty("status", out var statusElement))
                return statusElement.GetString();

            return null;
        }

    }


    public class ReembolsoRequest
    {
        public long TransactionId { get; set; }
        public decimal? Amount { get; set; }
        public int RestauranteId { get; set; }
    }
    public class PagamentoRequest
    {
        public PagamentoCartaoDTO DadosPagamento { get; set; }
        public PedidoDTO PedidoDTO { get; set; }
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
}
