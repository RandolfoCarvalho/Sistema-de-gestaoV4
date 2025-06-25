using MercadoPago.Resource.Payment;
using SistemaDeGestao.Models.DTOs.Responses;
using SistemaDeGestao.Models.DTOs.Resquests;

namespace SistemaDeGestao.Interfaces
{
    public interface IMercadoPagoService
    {
        Task<PagamentoPixResponse> ProcessarPixAsync(PagamentoPixDTO pagamento, PedidoDTO pedidoDTO, string accessToken);
        Task<ReembolsoResponseDTO> ProcessarReembolso(ReembolsoRequest request, string accessToken);
        Task<Payment> CriarPagamentoAsync(PagamentoCartaoDTO dados, PedidoDTO pedido, string token);
        Task<Payment> CapturarPagamentoAsync(long paymentId, string accessToken);
        Task CancelarPagamentoAsync(long paymentId, string accessToken);
        Task ReverterPagamentoAsync(long id, string token);
    }
}
