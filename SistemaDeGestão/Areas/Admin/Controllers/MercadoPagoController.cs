using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using MercadoPago.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models.DTOs.Resquests;
using SistemaDeGestão.Services;

namespace SistemaDeGestão.Controllers
{
    [Route("api/1.0/[controller]")]
    public class MercadoPagoController : Controller
    {
        private readonly MercadoPagoService _paymentService;
        private readonly IConfiguration _configuration;
        private readonly DataBaseContext _context;
        private readonly PedidoService _pedidoService;
        private readonly IHubContext<OrderHub> _hubContext;
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();
        private readonly string _accessToken = "APP_USR-4929793273828266-031923-dd42ca24161f10acffd4785370c0358b-482914930";

        //private readonly string _accessToken = "TEST-4929793273828266-031923-ae707d0d8d7446b92af91ce1c37dec0d-482914930";
        public MercadoPagoController(MercadoPagoService paymentService, IConfiguration configuration,
            DataBaseContext context, PedidoService pedidoService, IHubContext<OrderHub> hubContext)
        {
            _paymentService = paymentService;
            _configuration = configuration;
            _context = context;
            _pedidoService = pedidoService;
            _hubContext = hubContext;
        }

        [HttpPost("processaPagamentoPix")]
        public async Task<IActionResult> ProcessarPagamentoPix([FromBody] PagamentoRequestPix request)
        {
            if (request?.DadosPagamento == null || request?.PedidoDTO == null)
                return BadRequest("Dados incompletos.");

            var resultado = await _paymentService.ProcessarPixAsync(request.DadosPagamento, request.PedidoDTO);
            return Ok(resultado);
        }

        [HttpPost]
        [Route("processaPagamento")]
        public async Task<IActionResult> ProcessaPagamento([FromBody] PagamentoRequest request)
        {
            try
            {
                var paymentResponse = await _paymentService.ProcessPayment(request.DadosPagamento, request.PedidoDTO);
                return Ok(paymentResponse);

            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao processar pagamento por cartão: " + ex.Message);
            }
        }
        [HttpPost("notificacaoMercadoPago")]
        public async Task<IActionResult> ReceiveMercadoPagoWebhook([FromBody] JsonElement notification)
        {
            try
            {
                if (!notification.TryGetProperty("data", out var data) ||
                    !data.TryGetProperty("id", out var paymentIdElement))
                {
                    return BadRequest("ID de pagamento não encontrado.");
                }

                string transactionId = paymentIdElement.GetString();

                using var client = new HttpClient();
                string url = $"https://api.mercadopago.com/v1/payments/{transactionId}?access_token={_accessToken}";
                var response = await client.GetAsync(url);

                if (!response.IsSuccessStatusCode)
                {
                    return StatusCode((int)response.StatusCode, "Erro ao buscar informações de pagamento.");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var paymentData = JsonDocument.Parse(responseContent).RootElement;

                if (!paymentData.TryGetProperty("status", out var statusElement))
                {
                    return BadRequest("Status de pagamento não encontrado.");
                }

                string status = statusElement.GetString();
                if (status == "approved")
                {
                    await ProcessarPagamentoAprovadoAsync(transactionId);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Erro ao processar notificação: {ex.Message}");
            }
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

                _context.PedidosPendentes.Remove(pedidoPendente);
                await _context.SaveChangesAsync();

                var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                await _pedidoService.CriarPedidoAsync(pedidoDTO);
                await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", pedidoDTO);
            }
            finally
            {
                semaphore.Release();
                _ = Task.Delay(4000).ContinueWith(t => _locks.TryRemove(transactionId, out _));
            }
        }

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
