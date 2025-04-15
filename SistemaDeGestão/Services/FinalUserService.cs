using Microsoft.EntityFrameworkCore;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models;
using SistemaDeGestão.Models.DTOs;
using SistemaDeGestão.Services.Interfaces;

namespace SistemaDeGestão.Services
{
    public class FinalUserService : IFinalUserService
    {
        private readonly DataBaseContext _context;

        public FinalUserService(DataBaseContext context)
        {
            _context = context;
        }

        public async Task<FinalUser> BuscarPorTelefone(string telefone)
        {
            return await _context.FinalUsers
                .FirstOrDefaultAsync(c => c.Telefone == telefone);
        }

        public async Task<FinalUser> CriarCliente(FinalUser user)
        {
            var cliente = new FinalUser
            {
                Telefone = user.Telefone,
                Nome = user.Nome,
                DataCriacao = DateTime.UtcNow
            };

            _context.FinalUsers.Add(cliente);
            await _context.SaveChangesAsync();

            return cliente;
        }

        public async Task<IEnumerable<Pedido>> GetPedidosByUser(string telefone, int restauranteId)
        {
            var pedidos = await _context.Pedidos
                .Where(p => p.FinalUserTelefone == telefone && p.RestauranteId == restauranteId)
                .OrderByDescending(p => p.DataPedido)
                .Include(p => p.Pagamento) // Inclui o pagamento relacionado
                .Include(p => p.EnderecoEntrega) // Inclui o endereço de entrega relacionado
                .Include(p => p.Itens) // Inclui os itens do pedido
                .ThenInclude(i => i.OpcoesExtras) // Inclui as opções extras para cada item
                .ToListAsync();

            return pedidos;
        }


    }
}
