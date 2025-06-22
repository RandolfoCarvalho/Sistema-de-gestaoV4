using SistemaDeGestao.Controllers;
using SistemaDeGestao.Models.DTOs.Responses;
using SistemaDeGestao.Models.DTOs.Resquests;
using System.Threading.Tasks;

namespace SistemaDeGestao.Interfaces
{
    public interface IPagamentoOrchestratorService
    {
        Task<PagamentoPixResponse> IniciarPagamentoPixAsync(PagamentoRequestPix request);
        Task<PaymentResponseDTO> IniciarPagamentoCartaoAsync(PagamentoRequest request);
        Task<PagamentoDinheiroResponseDTO> ProcessarPagamentoDinheiroAsync(PagamentoRequestDinheiro request);
        Task<object> ProcessarReembolsoAsync(ReembolsoRequest request);
        Task<object> ObterStatusPagamentoClienteAsync(long pagamentoId, int restauranteId);
        Task ProcessarNotificacaoWebhookAsync(string transactionId);
        Task<object> VerificarStatusPagamentoPollingAsync(string transactionId);
        Task<WebhookProcessamentoResult> ProcessarNotificacaoPixWebhookAsync(string transactionId);
    }
}

