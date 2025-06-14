using SistemaDeGestao.Models.DTOs.Responses;
using SistemaDeGestao.Models.DTOs.Resquests;

namespace SistemaDeGestao.Interfaces
{
    public interface IMercadoPagoService
    {
        Task<PagamentoPixResponse> ProcessarPixAsync(PagamentoPixDTO pagamento, PedidoDTO pedidoDTO, string accessToken);
        Task<PaymentResponseDTO> ProcessPayment(PagamentoCartaoDTO paymentData, PedidoDTO pedidoDTO, string accessToken);
        Task<ReembolsoResponseDTO> ProcessarReembolso(ReembolsoRequest request, string accessToken);
    }
}
