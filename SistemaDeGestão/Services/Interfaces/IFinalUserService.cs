using SistemaDeGestão.Models;

namespace SistemaDeGestão.Services.Interfaces
{
    public interface IFinalUserService
    {
        Task<FinalUser> BuscarPorTelefone(string telefone);
        Task<FinalUser> CriarCliente(FinalUser telefone);
        Task<IEnumerable<Pedido>> GetPedidosByUser(string telefone, int restauranteId);
    }
}
