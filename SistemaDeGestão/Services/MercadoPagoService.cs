using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models;
using System.Text;
using SistemaDeGestão.Models.DTOs.Resquests;
using SistemaDeGestão.Models.DTOs.Responses;
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

namespace SistemaDeGestão.Services
{
    public class MercadoPagoService
    {
        private readonly DataBaseContext _context;
        private readonly string _accessToken = "APP_USR-4929793273828266-031923-dd42ca24161f10acffd4785370c0358b-482914930";
        private readonly IConfiguration _configuration;
        public MercadoPagoService(DataBaseContext dataBaseContext, IConfiguration configuration)
        {
            _context = dataBaseContext;
            _configuration = configuration;
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
                    notification_url = "https://grupopedejaprod.azurewebsites.net/api/1.0/MercadoPago/notificacaoMercadoPago",
                    payer = new
                    {
                        email = pagamento.PayerEmail,
                        first_name = pagamento.PayerFirstName,
                        last_name = pagamento.PayerLastName
                    }
                };

                // Serialize only once
                var content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
                client.DefaultRequestHeaders.Add("X-Idempotency-Key", Guid.NewGuid().ToString());

                var response = await client.PostAsync(url, content);

                if (!response.IsSuccessStatusCode)
                {
                    var errContent = await response.Content.ReadAsStringAsync();
                    throw new Exception($"Erro ao processar pagamento: {errContent}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                var doc = JsonDocument.Parse(responseContent);

                var qrCodeBase64 = doc.RootElement
                    .GetProperty("point_of_interaction")
                    .GetProperty("transaction_data")
                    .GetProperty("qr_code_base64").GetString();

                var qrCode = doc.RootElement
                    .GetProperty("point_of_interaction")
                    .GetProperty("transaction_data")
                    .GetProperty("qr_code").GetString();

                var id = doc.RootElement.GetProperty("id").GetInt64();
                var valor = doc.RootElement.GetProperty("transaction_amount").GetDecimal();

                var pedidoPendente = new PedidoPendente
                {
                    TransactionId = id.ToString(),
                    PedidoJson = JsonConvert.SerializeObject(pedidoDTO),
                    DataCriacao = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                            TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"))
                };
                _context.PedidosPendentes.Add(pedidoPendente);
                await _context.SaveChangesAsync();

                return new PagamentoPixResponse
                {
                    IdPagamento = id.ToString(),
                    QrCodeBase64 = qrCodeBase64,
                    QrCodeString = qrCode,
                    ValorTotal = valor
                };
            }
        }

        public async Task<PaymentResponseDTO> ProcessPayment(PagamentoCartaoDTO paymentData, PedidoDTO pedidoDTO, string accessToken)
        {
            try
            {
                // Card token é enviado diretamente do frontend
                string cardToken = paymentData.Token;

                // Validar se o token ou amount
                if (string.IsNullOrWhiteSpace(cardToken)) throw new ArgumentException("O token do cartão é obrigatório.", nameof(paymentData.Token));
                if (paymentData.Amount <= 0) throw new ArgumentException("O valor da transação deve ser positivo.", nameof(paymentData.Amount));

                // Configurar o SDK
                MercadoPagoConfig.AccessToken = accessToken;
                // Configurar opções da requisição
                var requestOptions = new RequestOptions();
                requestOptions.CustomHeaders.Add("x-idempotency-key", Guid.NewGuid().ToString());

                // Criar itens para additional info
                var items = pedidoDTO.Itens.Select(item => new PaymentItemRequest
                {
                    Id = item.ProdutoId.ToString(),
                    Title = item.NomeProduto ?? $"Produto {item.ProdutoId}",
                    CategoryId = "food",
                    Description = "Descricao item",
                    Quantity = item.Quantidade,
                    UnitPrice = item.PrecoUnitario
                }).ToList();

                // Payer info para additional info
                var payerInfo = new PaymentAdditionalInfoPayerRequest
                {
                    FirstName = paymentData.PayerFirstName,
                    LastName = paymentData.PayerLastName,
                    IsFirstPurchaseOnline = true,
                    Phone = new PhoneRequest
                    {
                        AreaCode = "64",
                        Number = "987654321"
                    },
                    Address = new AddressRequest
                    {
                        ZipCode = "12312-123",
                        StreetName = "Av das Nacoes Unidas",
                        StreetNumber = "3003"
                    }
                };

                // Shipments info
                var shipmentsInfo = new PaymentShipmentsRequest
                {
                    ReceiverAddress = new PaymentReceiverAddressRequest
                    {
                        ZipCode = "12312-123",
                        StateName = "SP",
                        CityName = "São Paulo",
                        StreetName = "Av das Nacoes Unidas",
                        StreetNumber = "3003"
                    }
                };

                // Additional info
                var additionalInfo = new PaymentAdditionalInfoRequest
                {
                    Items = items,
                    Payer = payerInfo,
                    Shipments = shipmentsInfo,
                };

                // Payer request
                var paymentPayerRequest = new PaymentPayerRequest
                {
                    EntityType = "individual",
                    Type = "customer",
                    Id = null,
                    Email = paymentData.PayerEmail,
                    FirstName = paymentData.PayerFirstName,
                    LastName = paymentData.PayerLastName,
                    Identification = new IdentificationRequest
                    {
                        Type = paymentData.PayerIdentificationType,
                        Number = paymentData.PayerIdentificationNumber
                    }
                };

                // Statement descriptor (nome na fatura)
                string statementDescriptor = pedidoDTO.NomeDaLoja.Length > 10
                    ? pedidoDTO.NomeDaLoja.Substring(0, 10)
                    : pedidoDTO.NomeDaLoja;

                // Metadados
                var metadata = new Dictionary<string, object>
        {
            { "store_id", pedidoDTO.RestauranteId }
        };

                // Criar o request de pagamento
                var request = new PaymentCreateRequest
                {
                    TransactionAmount = paymentData.Amount,
                    Installments = 1,
                    Capture = true,
                    BinaryMode = true,
                    PaymentMethodId = paymentData.PaymentMethodId,
                    Token = cardToken,
                    ExternalReference = "1", // Usar um ID único do pedido do seu sistema
                    NotificationUrl = "https://grupopedejaprod.azurewebsites.net/api/1.0/MercadoPago/notificacaoMercadoPago",
                    Metadata = metadata,
                    Payer = paymentPayerRequest,
                    StatementDescriptor = statementDescriptor,
                    Description = "Pedido",
                    AdditionalInfo = additionalInfo
                };

                // Criar cliente e processar pagamento
                var client = new PaymentClient();
                Payment payment = await client.CreateAsync(request, requestOptions);

                // Salvar pedido pendente
                var pedidoPendente = new PedidoPendente
                {
                    TransactionId = payment.Id.ToString(),
                    PedidoJson = JsonConvert.SerializeObject(pedidoDTO),
                    DataCriacao = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow,
                            TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"))
                };
                _context.PedidosPendentes.Add(pedidoPendente);
                await _context.SaveChangesAsync();

                // Retornar resposta
                return new PaymentResponseDTO
                {
                    Status = payment.Status,
                    TransactionId = payment.Id.ToString(),
                    Message = payment.StatusDetail,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (ArgumentException argEx) // Captura erros de validação
            {
                Console.WriteLine($"Erro de argumento ao processar pagamento: {argEx.Message}");
                return new PaymentResponseDTO
                {
                    Status = "error",
                    Message = $"Erro nos dados fornecidos: {argEx.Message}",
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (MercadoPagoApiException mpEx)
            {
                Console.WriteLine($"Erro na API do Mercado Pago: {mpEx.Message}");
                return new PaymentResponseDTO
                {
                    Status = "error",
                    Message = $"Erro no processamento do pagamento: {mpEx.Message}",
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (HttpRequestException httpEx)
            {
                Console.WriteLine($"Erro de HTTP ao chamar Mercado Pago: {httpEx.Message}");
                return new PaymentResponseDTO
                {
                    Status = "error",
                    Message = "Erro de comunicação ao processar pagamento.",
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Newtonsoft.Json.JsonException jsonEx)
            {
                Console.WriteLine($"Erro de JSON ao processar resposta do Mercado Pago: {jsonEx.Message}");
                return new PaymentResponseDTO
                {
                    Status = "error",
                    Message = "Erro ao interpretar a resposta do processador de pagamento.",
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro inesperado ao processar pagamento: {ex.ToString()}");
                return new PaymentResponseDTO
                {
                    Status = "error",
                    Message = "Ocorreu um erro inesperado ao processar seu pagamento. Tente novamente mais tarde.",
                    Timestamp = DateTime.UtcNow
                };
            }
        }

    }
}
