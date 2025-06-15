using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using System;
using SistemaDeGestao.Interfaces;
public class MercadoPagoApiClient : IMercadoPagoApiClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<MercadoPagoApiClient> _logger;

    public MercadoPagoApiClient(HttpClient httpClient, ILogger<MercadoPagoApiClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        // Configurações base do cliente são feitas aqui
        _httpClient.BaseAddress = new Uri("https://api.mercadopago.com/v1/payments/");
        _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
    }

    public async Task<string> ObterStatusPagamentoAsync(string pagamentoId, string accessToken)
    {
        // Cria uma nova mensagem de requisição para poder setar o token de autorização por chamada
        var requestMessage = new HttpRequestMessage(HttpMethod.Get, pagamentoId);
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

        var response = await _httpClient.SendAsync(requestMessage);

        if (!response.IsSuccessStatusCode)
        {
            string errorMessage = await response.Content.ReadAsStringAsync();
            _logger.LogError("Erro ao consultar a API do Mercado Pago para o pagamento {PagamentoId}. Status: {StatusCode}, Resposta: {ErrorMessage}", pagamentoId, response.StatusCode, errorMessage);
            throw new HttpRequestException($"Erro ao consultar o status do pagamento: {response.ReasonPhrase}");
        }

        var content = await response.Content.ReadAsStringAsync();
        var paymentData = JsonDocument.Parse(content).RootElement;

        if (!paymentData.TryGetProperty("status", out var statusElement))
        {
            _logger.LogError("A propriedade 'status' não foi encontrada na resposta da API do Mercado Pago para o pagamento {PagamentoId}", pagamentoId);
            throw new KeyNotFoundException("Propriedade 'status' não encontrada na resposta da API.");
        }
        return statusElement.GetString();
    }
}