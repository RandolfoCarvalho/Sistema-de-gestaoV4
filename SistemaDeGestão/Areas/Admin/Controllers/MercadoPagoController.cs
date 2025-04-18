using System;
using System.Collections.Concurrent;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Azure.Core;
using MercadoPago.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models;
using SistemaDeGestão.Models.DTOs.Resquests;
using SistemaDeGestão.Services;
using SistemaDeGestão.Services.Interfaces;

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
        private readonly IEncryptionService _encryptionService;
        private static readonly ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

        public MercadoPagoController(MercadoPagoService paymentService, IConfiguration configuration,
            DataBaseContext context, PedidoService pedidoService, IHubContext<OrderHub> hubContext, IEncryptionService encryptionService)
        {
            _paymentService = paymentService;
            _configuration = configuration;
            _context = context;
            _pedidoService = pedidoService;
            _hubContext = hubContext;
            _encryptionService = encryptionService;
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
            var restauranteId = 1;
            var accessToken = await BuscaCredenciaisAsync(restauranteId);
            var resultado = await _paymentService.ProcessarReembolso(request, accessToken);
            return Ok(resultado);
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

                //Buscar restauranteId
                var pedidoPendente = await _context.PedidosPendentes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TransactionId == transactionId);

                if (pedidoPendente == null)
                    return NotFound("Pedido pendente não encontrado.");

                //Dados estejam serializados como JSON e contenham o restauranteId
                var dados = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                var restauranteId = dados?.RestauranteId ?? 0;

                if (restauranteId == 0)
                    return BadRequest("RestauranteId não encontrado.");

                var accessToken = await BuscaCredenciaisAsync(restauranteId);

                using var client = new HttpClient();
                string url = $"https://api.mercadopago.com/v1/payments/{transactionId}?access_token={accessToken}";
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

    }

    public class ReembolsoRequest
    {
        public long TransactionId { get; set; }
        public decimal? Amount { get; set; }
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
