using SistemaDeGestao.Models;

namespace SistemaDeGestao.Services.Interfaces
{
    public interface IFinalUserService
    {
        Task<FinalUser> BuscarPorTelefone(string telefone, string nome);
        Task<FinalUser> CriarCliente(FinalUser telefone);
        Task<IEnumerable<Pedido>> GetPedidosByUser(string telefone, int restauranteId);
    }
}
