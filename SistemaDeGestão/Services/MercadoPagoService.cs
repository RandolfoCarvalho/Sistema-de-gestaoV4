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

namespace SistemaDeGestao.Services
{
    public class MercadoPagoService
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
                    // URL de notificação completa e correta
                    //notification_url = "https://api.fomedique.com.br/api/1.0/MercadoPago/notificacaoMercadoPago",
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

                // Obtém o ID do pagamento - esta é a referência principal
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

                // Importante: Sempre usar o ID do pagamento como TransactionId para consistência
                pedidoDTO.Pagamento.TransactionId = paymentId;

                // Salva o pedido pendente com o ID do pagamento
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
                    // Usar sempre o mesmo ID para evitar confusão
                    TransactionId = paymentId
                };
            }
        }
        public async Task<PaymentResponseDTO> ProcessPayment(PagamentoCartaoDTO paymentData, PedidoDTO pedidoDTO, string accessToken)
        {
            Console.WriteLine("==================== INÍCIO DO PROCESSAMENTO DE PAGAMENTO ====================");
            try
            {
                Console.WriteLine($"Iniciando processamento de pagamento. Valor: {paymentData.Amount}, Restaurante: {pedidoDTO.RestauranteId}");

                // Verificar conexão com o banco de dados
                try
                {
                    var canConnect = await _context.Database.CanConnectAsync();
                    Console.WriteLine($"Teste de conexão com banco de dados: {(canConnect ? "SUCESSO" : "FALHA")}");

                    if (!canConnect)
                    {
                        Console.WriteLine("ERRO: Não foi possível conectar ao banco de dados");
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
                    Console.WriteLine($"ERRO ao testar conexão com banco de dados: {dbEx.Message}");
                    Console.WriteLine($"StackTrace: {dbEx.StackTrace}");
                }

                // Card token é enviado diretamente do frontend
                string cardToken = paymentData.Token;

                // Validar se o token ou amount
                if (string.IsNullOrWhiteSpace(cardToken))
                {
                    Console.WriteLine("ERRO: Token do cartão não informado");
                    throw new ArgumentException("O token do cartão é obrigatório.", nameof(paymentData.Token));
                }
                if (paymentData.Amount <= 0)
                {
                    Console.WriteLine($"ERRO: Valor inválido: {paymentData.Amount}");
                    throw new ArgumentException("O valor da transação deve ser positivo.", nameof(paymentData.Amount));
                }

                Console.WriteLine("Configurando SDK do Mercado Pago");
                // Configurar o SDK
                MercadoPagoConfig.AccessToken = accessToken;
                Console.WriteLine($"Access Token configurado [primeiros 5 caracteres]: {accessToken.Substring(0, Math.Min(5, accessToken.Length))}...");

                // Configurar opções da requisição
                var requestOptions = new RequestOptions();
                var idempotencyKey = Guid.NewGuid().ToString();
                requestOptions.CustomHeaders.Add("x-idempotency-key", idempotencyKey);
                Console.WriteLine($"Idempotency key gerada: {idempotencyKey}");

                // Criar itens para additional info
                Console.WriteLine($"Preparando dados do pedido. Total de itens: {pedidoDTO.Itens.Count}");
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
                Console.WriteLine("Montando requisição de pagamento para o Mercado Pago");
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

                // Criar cliente e processar pagamento
                Console.WriteLine("Enviando requisição para o Mercado Pago");
                var client = new PaymentClient();
                Payment payment = null;
                try
                {
                    payment = await client.CreateAsync(request, requestOptions);
                    Console.WriteLine($"Pagamento criado com sucesso! ID: {payment.Id}, Status: {payment.Status}");
                }
                catch (Exception mpEx)
                {
                    Console.WriteLine($"ERRO ao criar pagamento no Mercado Pago: {mpEx.Message}");
                    throw;
                }

                Console.WriteLine("Preparando para salvar pedido pendente");
                pedidoDTO.Pagamento.TransactionId = payment.Id.ToString();

                // Criar JSON do pedido
                string pedidoJson;
                try
                {
                    pedidoJson = JsonConvert.SerializeObject(pedidoDTO);
                    Console.WriteLine($"JSON do pedido gerado com sucesso. Tamanho: {pedidoJson.Length} caracteres");
                }
                catch (Exception jsonEx)
                {
                    Console.WriteLine($"ERRO ao serializar pedidoDTO: {jsonEx.Message}");
                    throw;
                }

                // Verificar se o TimeZone está disponível
                try
                {
                    var timeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
                    Console.WriteLine($"TimeZone encontrado: {timeZone.Id}, DisplayName: {timeZone.DisplayName}");
                }
                catch (TimeZoneNotFoundException tzEx)
                {
                    Console.WriteLine($"ERRO: TimeZone não encontrado: {tzEx.Message}");
                    Console.WriteLine("Listando TimeZones disponíveis:");
                    foreach (var tz in TimeZoneInfo.GetSystemTimeZones().Take(5))
                    {
                        Console.WriteLine($"  - {tz.Id}: {tz.DisplayName}");
                    }
                }

                // Salvar pedido pendente
                Console.WriteLine("Tentando criar objeto PedidoPendente");
                var pedidoPendente = new PedidoPendente
                {
                    TransactionId = payment.Id.ToString(),
                    PedidoJson = pedidoJson,
                    DataCriacao = DateTime.UtcNow // Simplificado para evitar problemas com TimeZone
                };

                try
                {
                    Console.WriteLine($"Adicionando pedido pendente ao contexto. TransactionId: {pedidoPendente.TransactionId}");
                    _context.PedidosPendentes.Add(pedidoPendente);

                    Console.WriteLine("Executando SaveChangesAsync()");
                    int registrosAfetados = await _context.SaveChangesAsync();
                    Console.WriteLine($"SaveChangesAsync() executado. Registros afetados: {registrosAfetados}");

                    // Verificar se o registro foi realmente salvo
                    Console.WriteLine("Verificando se o registro foi salvo corretamente");
                    var verificacao = await _context.PedidosPendentes
                        .AsNoTracking()
                        .FirstOrDefaultAsync(p => p.TransactionId == payment.Id.ToString());

                    if (verificacao == null)
                    {
                        Console.WriteLine("ATENÇÃO: Registro não encontrado após SaveChanges!");

                        // Tentar salvar novamente com um registro de teste simples
                        Console.WriteLine("Tentando salvar um registro de teste simples");
                        var registroTeste = new PedidoPendente
                        {
                            TransactionId = "TESTE-" + Guid.NewGuid().ToString(),
                            PedidoJson = "{\"teste\":true}",
                            DataCriacao = DateTime.UtcNow
                        };

                        _context.PedidosPendentes.Add(registroTeste);
                        int resultadoTeste = await _context.SaveChangesAsync();
                        Console.WriteLine($"Resultado do teste: {resultadoTeste} registro(s) afetado(s)");
                    }
                    else
                    {
                        Console.WriteLine($"Registro verificado com sucesso na base. ID: {verificacao.Id}");
                    }
                }
                catch (DbUpdateException dbEx)
                {
                    Console.WriteLine($"ERRO DE BANCO DE DADOS ao salvar pedido pendente: {dbEx.Message}");
                    Console.WriteLine($"Inner Exception: {dbEx.InnerException?.Message}");

                    // Verificar o estado da entidade
                    var entry = _context.Entry(pedidoPendente);
                    Console.WriteLine($"Estado da entidade: {entry.State}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"ERRO GERAL ao salvar pedido pendente: {ex.Message}");
                    Console.WriteLine($"StackTrace: {ex.StackTrace}");
                }

                // Mesmo se houver erro ao salvar, retorna a resposta
                Console.WriteLine("Preparando resposta para o cliente");

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

    }
}
