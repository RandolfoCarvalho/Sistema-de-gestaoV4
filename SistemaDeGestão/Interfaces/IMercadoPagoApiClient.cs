using System.Threading.Tasks;

namespace SistemaDeGestao.Interfaces
{
    public interface IMercadoPagoApiClient
    {
        Task<string> ObterStatusPagamentoAsync(string pagamentoId, string accessToken);
    }
}
