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
        
        public async Task<PaymentResponseDTO> ProcessPayment(PagamentoCartaoDTO paymentData, PedidoDTO pedidoDTO, string accessToken)
        {
            await VerificarDisponbilidadeProduto(pedidoDTO);
            Console.WriteLine("==================== INÍCIO DO PROCESSAMENTO DE PAGAMENTO ====================");
            try
            {
                try
                {
                    var canConnect = await _context.Database.CanConnectAsync();
                    if (!canConnect)
                    {
                        return new PaymentResponseDTO
                        {
                            Status = "error",
                            Message = "Erro de conexão com o banco de dados",
                            Timestamp = DateTime.UtcNow
                        };
                    }
                }
                catch (Exception dbEx)
                {
                    throw;
                }

                // Card token é enviado diretamente do frontend
                string cardToken = paymentData.Token;

                // Validar se o token ou amount
                if (string.IsNullOrWhiteSpace(cardToken))
                {
                    throw new ArgumentException("O token do cartão é obrigatório.", nameof(paymentData.Token));
                }
                if (paymentData.Amount <= 0)
                {
                    throw new ArgumentException("O valor da transação deve ser positivo.", nameof(paymentData.Amount));
                }

                // Configurar o SDK

                var requestOptions = new RequestOptions
                {
                    AccessToken = accessToken,
                    CustomHeaders = { { "x-idempotency-key", Guid.NewGuid().ToString() } }
                };
                _logger.LogInformation("RequestOptions com AccessToken e Idempotency Key criados para a requisição.");
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

                string ddd = pedidoDTO.FinalUserTelefone.Substring(0, 2);           // "64"
                string numero = pedidoDTO.FinalUserTelefone.Substring(2);
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
                        ZipCode = pedidoDTO.Endereco.CEP,
                        StreetName = pedidoDTO.Endereco.Logradouro,
                        StreetNumber = pedidoDTO.Endereco.Numero
                    }
                };

                // Shipments info
                var shipmentsInfo = new PaymentShipmentsRequest
                {
                    ReceiverAddress = new PaymentReceiverAddressRequest
                    {
                        ZipCode = pedidoDTO.Endereco.CEP,
                        StateName = "GO",
                        CityName = pedidoDTO.Endereco.Cidade,
                        StreetName = pedidoDTO.Endereco.Logradouro,
                        StreetNumber = pedidoDTO.Endereco.Numero
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
                    NotificationUrl = "https://api.fomedique.com.br/api/1.0/MercadoPago/notificacaoMercadoPago",
                    Metadata = metadata,
                    Payer = paymentPayerRequest,
                    StatementDescriptor = statementDescriptor,
                    Description = "Pedido",
                    AdditionalInfo = additionalInfo
                };

                var client = new PaymentClient();
                Payment payment;
                payment = await client.CreateAsync(request, requestOptions);
                pedidoDTO.Pagamento.TransactionId = payment.Id.ToString();

                // Criar JSON do pedido
                string pedidoJson;
                try
                {
                    pedidoJson = JsonConvert.SerializeObject(pedidoDTO);
                }
                catch (Exception jsonEx)
                {
                    throw;
                }

                // Verificar se o TimeZone está disponível
                try
                {
                    var timeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
                }
                catch (TimeZoneNotFoundException tzEx)
                {
                    throw new TimeZoneNotFoundException("Erro em TimeZone: " + tzEx.Message);
                }

                // Salvar pedido pendente
                var pedidoPendente = new PedidoPendente
                {
                    TransactionId = payment.Id.ToString(),
                    PedidoJson = pedidoJson,
                    DataCriacao = DateTime.UtcNow 
                };

                try
                {
                    _context.PedidosPendentes.Add(pedidoPendente);

                    int registrosAfetados = await _context.SaveChangesAsync();
                    // Verificar se o registro foi realmente salvo
                    var verificacao = await _context.PedidosPendentes
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.TransactionId == payment.Id.ToString());

                    if (verificacao != null)
                    {
                        Console.WriteLine($"Registro verificado com sucesso na base. ID: {verificacao.Id}");
                    }
                }
                catch (DbUpdateException dbEx)
                {
                    throw new DbUpdateException("erro no update db: " + dbEx.Message);
                }
                catch (Exception ex)
                {
                    throw new Exception("error: " + ex.Message);
                }

                // Retornar resposta
                return new PaymentResponseDTO
                {
                    Status = payment.Status,
                    TransactionId = payment.Id.ToString(),
                    Message = payment.StatusDetail,
                    Timestamp = DateTime.UtcNow
                };
            }
            catch (ArgumentException argEx)
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
            finally
            {
                Console.WriteLine("==================== FIM DO PROCESSAMENTO DE PAGAMENTO ====================");
            }
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
