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
            try
            {
                if (request?.DadosPagamento == null || request?.PedidoDTO == null)
                    return BadRequest("Dados incompletos.");

                _logger.LogInformation($"Iniciando processamento de pagamento PIX para restaurante: {request.PedidoDTO.RestauranteId}");
                
                // Validação adicional para garantir dados essenciais
                if (request.PedidoDTO.RestauranteId <= 0)
                    return BadRequest("ID do restaurante inválido.");

                var accessToken = await BuscaCredenciaisAsync(request.PedidoDTO.RestauranteId);
                var resultado = await _paymentService.ProcessarPixAsync(request.DadosPagamento, request.PedidoDTO, accessToken);
                
                _logger.LogInformation($"Pagamento PIX iniciado com sucesso. TransactionId: {resultado.TransactionId}");
                
                return Ok(resultado);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar pagamento PIX");
                return StatusCode(500, $"Erro ao processar pagamento: {ex.Message}");
            }
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
            _logger.LogInformation($"Verificando pagamento ID: {pagamentoId} para restaurante: {restauranteId}");
            
            try
            {
                string transactionId = pagamentoId.ToString();
                
                // Verificar se já existe um pedido para este pagamento
                var pedidoExistente = await _context.Pedidos
                    .AsNoTracking()
                    .Include(p => p.Pagamento)
                    .FirstOrDefaultAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId);
                
                if (pedidoExistente != null)
                {
                    _logger.LogInformation($"Pedido já existente para pagamento {pagamentoId}");
                    return Ok(new { status = "approved", message = "Pedido já existe" });
                }

                // Consultar status do pagamento na API do Mercado Pago
                string accessToken = await BuscaCredenciaisAsync(restauranteId);
                
                // Obter status do pagamento
                var statusPagamento = await ObterStatusPagamentoAsync(transactionId, accessToken);
                _logger.LogInformation($"Status do pagamento {pagamentoId}: {statusPagamento}");
                
                if (statusPagamento == "approved")
                {
                    // Verificar se existe um pedido pendente
                    var pedidoPendente = await _context.PedidosPendentes
                        .FirstOrDefaultAsync(p => p.TransactionId == transactionId);
                        
                    if (pedidoPendente == null)
                    {
                        _logger.LogWarning($"Pedido pendente não encontrado para pagamento aprovado {pagamentoId}");
                        return NotFound(new { status = statusPagamento, message = "Pedido pendente não encontrado" });
                    }
                    
                    try
                    {
                        // Processar o pagamento aprovado
                        await ProcessarPagamentoAprovadoAsync(transactionId);
                        return Ok(new { status = "approved", message = "Pedido criado com sucesso" });
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Erro ao processar pedido pendente para pagamento {pagamentoId}");
                        return StatusCode(500, new { status = "error", message = $"Erro ao processar pedido: {ex.Message}" });
                    }
                }
                
                // Se não for aprovado, retorna o status atual
                return Ok(new { status = statusPagamento });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao obter pagamento {pagamentoId}");
                return StatusCode(500, new { status = "error", message = ex.Message });
            }
        }

        [HttpPost]
        [Route("notificacaoMercadoPago")]
        [AllowAnonymous]
        public async Task<IActionResult> ReceiveMercadoPagoWebhook(
         [FromBody] JsonElement notification,
         [FromQuery] string id,
         [FromQuery] string topic,
         [FromQuery] string type)
        {
            try
            {
                _logger.LogInformation("Recebida notificação do Mercado Pago. Topic: {Topic}, Type: {Type}, Raw: {Raw}", 
                    topic, type, JsonSerializer.Serialize(notification));
                
                // Obter o ID da transação de várias fontes possíveis
                var transactionId = ObterTransactionId(notification, id, type);
                
                if (string.IsNullOrEmpty(transactionId))
                {
                    _logger.LogWarning("ID de pagamento não encontrado na notificação");
                    return BadRequest("ID de pagamento não encontrado.");
                }

                _logger.LogInformation("Processando notificação do Mercado Pago. TransactionId: {TransactionId}", transactionId);

                // Verificar se já existe um pedido para este pagamento para evitar duplicação
                var pedidoExistente = await _context.Pedidos
                    .AsNoTracking()
                    .AnyAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId);

                if (pedidoExistente)
                {
                    _logger.LogInformation("Pedido com TransactionId {TransactionId} já existe.", transactionId);
                    return Ok("Pedido já existe");
                }
                
                // Buscar pedido pendente com retry para garantir que o banco tenha registrado
                var pedidoPendente = await TentarObterPedidoPendenteAsync(transactionId, maxTentativas: 15, delayMs: 200);
                
                if (pedidoPendente == null)
                {
                    _logger.LogWarning("Pedido pendente não encontrado para TransactionId: {TransactionId} após várias tentativas", transactionId);
                    return Ok("Pedido pendente não encontrado. Será processado quando disponível.");
                }

                try
                {
                    var dados = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                    
                    if (dados?.RestauranteId is null or 0)
                    {
                        _logger.LogError("RestauranteId não encontrado no pedido pendente. TransactionId: {TransactionId}", transactionId);
                        return BadRequest("RestauranteId não encontrado.");
                    }

                    // Consultar status atualizado do pagamento
                    var accessToken = await BuscaCredenciaisAsync(dados.RestauranteId);
                    var statusPagamento = await ObterStatusPagamentoAsync(transactionId, accessToken);
                    
                    _logger.LogInformation("Status do pagamento {TransactionId}: {Status}", transactionId, statusPagamento);

                    if (statusPagamento == "approved")
                    {
                        _logger.LogInformation("Pagamento {TransactionId} aprovado, processando pedido", transactionId);
                        await ProcessarPagamentoAprovadoAsync(transactionId);
                        return Ok(new { status = "approved", message = "Pedido processado com sucesso" });
                    }
                    else
                    {
                        _logger.LogInformation("Pagamento {TransactionId} com status {Status}, nenhuma ação necessária", 
                            transactionId, statusPagamento);
                        return Ok(new { status = statusPagamento });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar dados do pedido pendente. TransactionId: {TransactionId}", transactionId);
                    return StatusCode(500, $"Erro ao processar pedido: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao processar notificação do Mercado Pago");
                return StatusCode(500, $"Erro ao processar notificação: {ex.Message}");
            }
        }

        //TODO - fazer o pooling do pagamento para pix
        [HttpGet]
        [Route("statusPagamento")]
        [AllowAnonymous]
        public async Task<IActionResult> VerificarStatusPagamento([FromQuery] string transactionId)
        {
            try
            {
                _logger.LogInformation($"Verificando status do pagamento: {transactionId}");
                
                // Primeiro verificar se já existe pedido para esta transação
                var pedidoExistente = await _context.Pedidos
                    .AsNoTracking()
                    .Include(p => p.Pagamento)
                    .FirstOrDefaultAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId);
                    
                if (pedidoExistente != null)
                {
                    _logger.LogInformation($"Pedido já existe para transação {transactionId}");
                    return Ok(new { status = "approved", message = "Pedido já processado" });
                }
                    
                // Verificar se existe um pedido pendente
                var pedidoPendente = await _context.PedidosPendentes
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.TransactionId == transactionId);
                    
                if (pedidoPendente == null)
                {
                    _logger.LogWarning($"Pedido pendente não encontrado para transação {transactionId}");
                    return NotFound(new { status = "not_found", message = "Pedido pendente não encontrado" });
                }
                    
                // Buscar dados do restaurante para acessar API do Mercado Pago
                var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                if (pedidoDTO?.RestauranteId == null || pedidoDTO.RestauranteId <= 0)
                {
                    _logger.LogError($"Dados do restaurante inválidos para transação {transactionId}");
                    return BadRequest(new { status = "error", message = "Dados do restaurante inválidos" });
                }
                    
                // Consultar status na API do Mercado Pago
                var accessToken = await BuscaCredenciaisAsync(pedidoDTO.RestauranteId);
                var statusMercadoPago = await ObterStatusPagamentoAsync(transactionId, accessToken);
                    
                _logger.LogInformation($"Status do Mercado Pago para transação {transactionId}: {statusMercadoPago}");
                    
                // Se aprovado, processar o pedido
                if (statusMercadoPago == "approved")
                {
                    await ProcessarPagamentoAprovadoAsync(transactionId);
                    return Ok(new { status = "approved", message = "Pagamento aprovado e pedido processado" });
                }
                    
                // Senão, retornar o status atual
                return Ok(new { status = statusMercadoPago });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Erro ao verificar status do pagamento {transactionId}");
                return StatusCode(500, new { status = "error", message = ex.Message });
            }
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
            _logger.LogInformation($"Iniciando processamento do pagamento aprovado com ID: {transactionId}");
            var semaphore = _locks.GetOrAdd(transactionId, _ => new SemaphoreSlim(1, 1));

            await semaphore.WaitAsync();
            try
            {
                // Verificar se já existe um pedido para este pagamento para evitar duplicação
                var pedidoExistente = await _context.Pedidos
                    .AsNoTracking()
                    .Include(p => p.Pagamento)
                    .AnyAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId);

                if (pedidoExistente)
                {
                    _logger.LogInformation($"Pedido para pagamento {transactionId} já foi criado anteriormente. Nenhuma ação necessária.");
                    return;
                }

                // Buscar o pedido pendente
                var pedidoPendente = await _context.PedidosPendentes
                    .FirstOrDefaultAsync(p => p.TransactionId == transactionId);
                
                if (pedidoPendente == null)
                {
                    _logger.LogWarning($"Pedido pendente com ID de transação {transactionId} não encontrado");
                    throw new Exception($"Pedido pendente não encontrado para pagamento {transactionId}");
                }

                try
                {
                    _logger.LogInformation($"Desserializando pedido pendente para transação {transactionId}");
                    var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
                    
                    // Garantir que o transactionId esteja correto
                    pedidoDTO.Pagamento.TransactionId = transactionId;
                    
                    // Criar o pedido
                    _logger.LogInformation($"Criando pedido para pagamento {transactionId}");
                    var result = await _pedidoService.CriarPedidoAsync(pedidoDTO);
                    if (result == null) throw new Exception("Pedido não criado pelo CriarPedidoAsync");
                    // Notificar os clientes
                    _logger.LogInformation($"Enviando notificação para pagamento {transactionId}");
                    await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", pedidoDTO);
                    
                    // Remover o pedido pendente apenas após o pedido estar criado com sucesso
                    _logger.LogInformation($"Removendo pedido pendente após criação bem-sucedida para pagamento {transactionId}");
                    _context.PedidosPendentes.Remove(pedidoPendente);
                    await _context.SaveChangesAsync();
                    
                    _logger.LogInformation($"Processamento do pagamento {transactionId} concluído com sucesso");
                }
                catch (JsonException jsonEx)
                {
                    _logger.LogError(jsonEx, $"Erro ao desserializar pedido pendente para pagamento {transactionId}");
                    throw new Exception($"Erro ao processar pedido: {jsonEx.Message}");
                }
                catch (DbUpdateException dbEx)
                {
                    _logger.LogError(dbEx, $"Erro de banco de dados ao processar pedido para pagamento {transactionId}");
                    throw new Exception($"Erro de banco de dados ao processar pedido: {dbEx.Message}");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, $"Erro geral ao processar pedido para pagamento {transactionId}");
                    throw new Exception($"Erro ao processar pedido: {ex.Message}");
                }
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

        private async Task<string> ObterStatusPagamentoAsync(string pagamentoId, string accessToken)
        {
            using (var httpClient = new HttpClient())
            {
                httpClient.BaseAddress = new Uri("https://api.mercadopago.com/v1/payments/");
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                
                var response = await httpClient.GetAsync(pagamentoId);
                
                if (!response.IsSuccessStatusCode)
                {
                    string errorMessage = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Erro ao consultar Mercado Pago: {errorMessage}");
                    throw new Exception($"Erro ao consultar pagamento: {response.StatusCode}");
                }
                
                var content = await response.Content.ReadAsStringAsync();
                var paymentData = JsonDocument.Parse(content).RootElement;
                
                if (!paymentData.TryGetProperty("status", out var statusElement))
                {
                    _logger.LogError("Status de pagamento não encontrado na resposta");
                    throw new Exception("Status de pagamento não encontrado.");
                }
                
                return statusElement.GetString();
            }
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
