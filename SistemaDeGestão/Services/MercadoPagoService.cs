using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using System.Text;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Models.DTOs.Responses;
using MercadoPago.Client.Payment;
using System.Net;
using System.Net.Http.Headers;
using System.Text.Json;
using MercadoPago.Client.Common;
using MercadoPago.Client;
using MercadoPago.Config;
using MercadoPago.Error;
using MercadoPago.Resource.Payment;
using Microsoft.AspNetCore.SignalR;
using SistemaDeGestao.Controllers;
using SistemaDeGestao.Interfaces;
using Serilog;

namespace SistemaDeGestao.Services
{
    public class MercadoPagoService : IMercadoPagoService
    {
        private readonly DataBaseContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<MercadoPagoService> _logger;
        public MercadoPagoService(DataBaseContext dataBaseContext, IConfiguration configuration, ILogger<MercadoPagoService> logger)
        {
            _context = dataBaseContext;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<PagamentoPixResponse> ProcessarPixAsync(PagamentoPixDTO pagamento, PedidoDTO pedidoDTO, string accessToken)
        {
            using (var client = new HttpClient())
            {
                var url = "https://api.mercadopago.com/v1/payments";
                var body = new
                {
                    transaction_amount = pagamento.Amount,
                    payment_method_id = "pix",
                    description = "Pedido via PIX",
                    notification_url = "https://api.fomedique.com.br/api/1.0/MercadoPago/notificacao",
                    payer = new
                    {
                        email = pagamento.PayerEmail,
                        first_name = pagamento.PayerFirstName,
                        last_name = pagamento.PayerLastName
                    }
                };

                var content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                client.DefaultRequestHeaders.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

                var response = await client.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Erro ao processar pagamento PIX: {errContent}");
                    throw new Exception($"Erro ao processar pagamento: {errContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(responseContent);

                var paymentId = doc.RootElement.GetProperty("id").GetInt64().ToString();
                var valor = doc.RootElement.GetProperty("transaction_amount").GetDecimal();

                var qrCodeBase64 = doc.RootElement
                    .GetProperty("point_of_interaction")
                    .GetProperty("transaction_data")
                    .GetProperty("qr_code_base64").GetString();

                var qrCode = doc.RootElement
                    .GetProperty("point_of_interaction")
                    .GetProperty("transaction_data")
                    .GetProperty("qr_code").GetString();

                pedidoDTO.Pagamento.TransactionId = paymentId;

                var pedidoPendente = new PedidoPendente
                {
                    TransactionId = paymentId,
                    PedidoJson = JsonConvert.SerializeObject(pedidoDTO),
                    DataCriacao = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                            TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"))
                };

                _logger.LogInformation($"Salvando pedido pendente para pagamento PIX. TransactionId: {paymentId}");
                _context.PedidosPendentes.Add(pedidoPendente);
                await _context.SaveChangesAsync();

                return new PagamentoPixResponse
                {
                    IdPagamento = paymentId,
                    QrCodeBase64 = qrCodeBase64,
                    QrCodeString = qrCode,
                    ValorTotal = valor,
                    TransactionId = paymentId
                };
            }
        }

        public async Task<Payment> CriarPagamentoAsync(PagamentoCartaoDTO paymentData, PedidoDTO pedidoDTO, string accessToken)
        {
            await VerificarDisponbilidadeProduto(pedidoDTO);
            var requestOptions = new RequestOptions
            {
                AccessToken = accessToken,
                CustomHeaders = { { "x-idempotency-key", Guid.NewGuid().ToString() } }
            };
            var items = pedidoDTO.Itens.Select(item => new PaymentItemRequest
            {
                Id = item.ProdutoId.ToString(),
                Title = item.NomeProduto ?? $"Produto {item.ProdutoId}",
                Quantity = item.Quantidade,
                UnitPrice = item.PrecoUnitario
            }).ToList();
            var paymentPayerRequest = new PaymentPayerRequest
            {
                EntityType = "individual",
                Type = "customer",
                Email = paymentData.PayerEmail,
                FirstName = paymentData.PayerFirstName,
                LastName = paymentData.PayerLastName,
                Identification = new IdentificationRequest
                {
                    Type = paymentData.PayerIdentificationType,
                    Number = paymentData.PayerIdentificationNumber
                }
            };
            var request = new PaymentCreateRequest
            {
                TransactionAmount = paymentData.Amount,
                Installments = 1,
                Capture = true,
                BinaryMode = true,
                PaymentMethodId = paymentData.PaymentMethodId,
                Token = paymentData.Token,
                Payer = paymentPayerRequest,
                Description = "Pedido",
                StatementDescriptor = pedidoDTO.NomeDaLoja.Length > 10 ? pedidoDTO.NomeDaLoja.Substring(0, 10) : pedidoDTO.NomeDaLoja
            };
            var client = new PaymentClient();
            return await client.CreateAsync(request, requestOptions);
        }
        public async Task ReverterPagamentoAsync(long paymentId, string accessToken)
        {
            var opts = new RequestOptions { AccessToken = accessToken };
            var payCli = new PaymentClient();
            var info = await payCli.GetAsync(paymentId, opts);

            try
            {
                switch (info.Status)
                {
                    case "approved": 
                        var refundCli = new PaymentRefundClient();
                        await refundCli.RefundAsync(paymentId, opts);
                        break;

                    case "authorized":
                    case "pending":
                    case "in_process":                  // autorizou mas não capturou
                        await payCli.CancelAsync(paymentId, opts);
                        break;
                    default:                           
                        break;
                }
            }
            catch (MercadoPagoApiException e)
            {
                throw new Exception(e.Message);
            }
        }
        public async Task<Payment> CapturarPagamentoAsync(long paymentId, string accessToken)
        {
            var client = new PaymentClient();
            var opts = new RequestOptions { AccessToken = accessToken };
            return await client.CaptureAsync(paymentId, opts);
        }

        public async Task CancelarPagamentoAsync(long paymentId, string accessToken)
        {
            var client = new PaymentClient();
            var opts = new RequestOptions { AccessToken = accessToken };
            await client.CancelAsync(paymentId, opts);
        }
        public async Task<ReembolsoResponseDTO> ProcessarReembolso(ReembolsoRequest request, string accessToken)
        {
            var httpClient = new HttpClient();
            var url = $"https://api.mercadopago.com/v1/payments/{request.TransactionId}/refunds";
            var reembolsoData = new
            {
                amount = request.Amount
            };
            var json = System.Text.Json.JsonSerializer.Serialize(reembolsoData);
            var httpRequest = new HttpRequestMessage(HttpMethod.Post, url)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            };
            // Cabeçalhos 
            httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
            httpRequest.Headers.Add("X-Idempotency-Key", Guid.NewGuid().ToString()); // Gera uma chave única para evitar duplicidade 
            var response = await httpClient.SendAsync(httpRequest);
            if (!response.IsSuccessStatusCode)
            {
                var erro = await response.Content.ReadAsStringAsync();
                throw new Exception($"Erro ao processar reembolso: {erro}");
            }
            var responseBody = await response.Content.ReadAsStringAsync();
            var jsonResponse = JsonDocument.Parse(responseBody).RootElement;
            var reembolsoResponse = new ReembolsoResponseDTO
            {
                TransactionId = (long)jsonResponse.GetProperty("payment_id").GetInt64(),
                Amount = jsonResponse.GetProperty("amount").GetDecimal(),
                Status = jsonResponse.GetProperty("status").GetString()
            };
            return reembolsoResponse;
        }

        private async Task VerificarDisponbilidadeProduto(PedidoDTO pedido)
        {
            foreach (var item in pedido.Itens)
            {
                var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.Id == item.ProdutoId);

                if (produto == null)
                    throw new InvalidOperationException($"Produto com ID {item.ProdutoId} não encontrado.");

                if (produto.EstoqueAtual < item.Quantidade)
                    throw new InvalidOperationException($"Estoque insuficiente para o produto '{produto.Nome}'. Quantidade solicitada: {item.Quantidade}, disponível: {produto.EstoqueAtual}");
            }
        }
    }
}
