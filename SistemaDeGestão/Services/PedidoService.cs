using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models;
using System.Numerics;

namespace SistemaDeGestão.Services
{
    public class PedidoService
    {
        private readonly DataBaseContext _context;
        private readonly ILogger<PedidoService> _logger;
        private readonly IHubContext<OrderHub> _hubContext;
        private readonly RestauranteService _restauranteService;
        private readonly IMapper _mapper;
        public PedidoService(DataBaseContext context, ILogger<PedidoService> logger, 
            IHubContext<OrderHub> hubContext, RestauranteService restauranteService, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
            _restauranteService = restauranteService;
            _mapper = mapper;
        }

        public async Task<IEnumerable<Pedido>> ListarPedidos()
        {
            return await _context.Pedidos
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .OrderByDescending(p => p.DataPedido)
                .ToListAsync();
        }
        public async Task<List<Pedido>> ListarPedidosAsync(OrderStatus? status = null)
        {
            try
            {
                IQueryable<Pedido> query = _context.Pedidos
                    .Include(p => p.Itens)
                    .AsNoTracking(); 
                if (status.HasValue)
                {
                    query = query.Where(p => p.Status == status.Value);
                }
                var limitedQuery = query
                    .OrderByDescending(p => p.DataPedido)
                    .Take(100);
                var pedidos = await limitedQuery.ToListAsync();
                return pedidos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao listar pedidos");
                throw;
            }
        }
        public async Task<Pedido> AtualizarStatusPedidoAsync(int id, OrderStatus novoStatus)
        {
            var pedido = await _context.Pedidos
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null) return null;
            pedido.Status = novoStatus;
            _context.Entry(pedido).CurrentValues.SetValues(pedido);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ReceiveOrderStatusUpdate", pedido.Id, novoStatus);
            return pedido;
        }
        public async Task<Pedido> ObterPedido(int id)
        {
            return await _context.Pedidos
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .FirstOrDefaultAsync(p => p.Id == id);
        }
        public async Task<Pedido> ObterPedidoPorIdeRestauranteId(int id, int restauranteId)
        {
            return await _context.Pedidos
                .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<Pedido> CriarPedidoAsync(PedidoDTO pedidoDTO)
        {
            if (pedidoDTO == null || !pedidoDTO.Itens.Any())
                throw new ArgumentException("O pedido deve conter pelo menos um item.");

            var empresa = await _context.Empresas.FirstOrDefaultAsync(e => e.RestauranteId == pedidoDTO.RestauranteId);
            if (empresa == null || !_restauranteService.IsLojaOpen(empresa)) return null;
            // Gerar um número único baseado no GUID
            BigInteger pedidoNumber = new BigInteger(Guid.NewGuid().ToByteArray().Take(4).ToArray());
            pedidoNumber = BigInteger.Abs(pedidoNumber) % 999999; 
            string numeroPedido = $"PED: {pedidoNumber:D5}";

            var pedido = _mapper.Map<Pedido>(pedidoDTO);
            pedido.Numero = numeroPedido;

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", pedidoDTO);
            return pedido;
        }


        /*public async Task<ItemPedido> AdicionarItemAoPedido(ItemPedido item)
        {
            var produto = await _context.Produtos.FindAsync(item.ProdutoId);
            if (produto == null) return null;

            item.PrecoUnitario = produto.PrecoVenda;
            item.SubTotal = item.PrecoUnitario * item.Quantidade;

            _context.ItensPedido.Add(item);
            await _context.SaveChangesAsync();
            await AtualizarValorTotalPedido(item.PedidoId);
            return item;
        }*/

        /*public async Task<ItemPedido> AtualizarOpcoesDoItem(int itemId, Dictionary<string, List<ItemPedidoOpcaoDTO>> opcoes)
        {
            var item = await _context.ItensPedido.Include(i => i.Pedido).FirstOrDefaultAsync(i => i.Id == itemId);
            if (item == null) return null;

            item.OpcoesExtras(opcoes);
            await _context.SaveChangesAsync();
            await AtualizarValorTotalPedido(item.PedidoId);
            return item;
        }*/
        /*public async Task<bool> RemoverItemDoPedido(int pedidoId, int itemId)
        {
            var item = await _context.ItensPedido
                .FirstOrDefaultAsync(i => i.Id == itemId && i.PedidoId == pedidoId);

            if (item == null) return false;

            _context.ItensPedido.Remove(item);
            await _context.SaveChangesAsync();
            await AtualizarValorTotalPedido(pedidoId);
            return true;
        }*/

        /*private async Task AtualizarValorTotalPedido(int pedidoId)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Itens)
                .FirstOrDefaultAsync(p => p.Id == pedidoId);

            if (pedido == null) return;

            decimal subtotal = pedido.Itens.Sum(item =>
            {
                decimal itemTotal = item.PrecoUnitario * item.Quantidade;

                var opcoesExtras = item.GetOpcoesExtras();
                if (opcoesExtras != null)
                {
                    foreach (var opcaoGrupo in opcoesExtras)
                    {
                        itemTotal += opcaoGrupo.Value.Sum(opcao => opcao.PrecoUnitario * opcao.Quantidade);
                    }
                }

                return itemTotal;
            });

            pedido.SubTotal = subtotal;
            pedido.ValorTotal = subtotal + pedido.TaxaEntrega - pedido.Desconto;

            await _context.SaveChangesAsync();
        } */

        private string GerarNumeroPedido()
        {
            return $"PED-{DateTime.Now:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 8)}";
        }

        //item pedido

        public async Task<IEnumerable<ItemPedido>> ListarItensPedido(int pedidoId)
        {
            return await _context.ItensPedido
                .Include(i => i.Produto)
                .Where(i => i.PedidoId == pedidoId)
                .ToListAsync();
        }

        public async Task<ItemPedido> ObterItemPedido(int id)
        {
            return await _context.ItensPedido
                .Include(i => i.Produto)
                .FirstOrDefaultAsync(i => i.Id == id);
        }

        /*public async Task<Dictionary<string, List<OpcoesItemPedido>>> ObterOpcoesDoItem(int id)
        {
            var item = await _context.ItensPedido.FindAsync(id);
            if (item == null) return null;
            return item.ItemOpcao();
        }*/

        /*public async Task<ItemPedido> CriarItemPedido(ItemPedido item)
        {
            try
            {
                if (item == null)
                    throw new ArgumentNullException(nameof(item), "Item do pedido não pode ser nulo");

                var pedido = await _context.Pedidos
                    .Include(p => p.Itens)
                    .FirstOrDefaultAsync(p => p.Id == item.PedidoId);

                if (pedido == null)
                    throw new InvalidOperationException($"Pedido com ID {item.PedidoId} não encontrado");

                var produto = await _context.Produtos
                    .FirstOrDefaultAsync(p => p.Id == item.ProdutoId);

                if (produto == null)
                    throw new InvalidOperationException($"Produto com ID {item.ProdutoId} não encontrado");

                item.PrecoUnitario = produto.PrecoVenda;
                item.SubTotal = item.Quantidade * item.PrecoUnitario;

                var opcoesGrupos = item.GetOpcoesExtras();
                if (opcoesGrupos != null)
                {
                    foreach (var grupo in opcoesGrupos)
                    {
                        foreach (var opcao in grupo.Value)
                        {
                            if (opcao.PrecoUnitario < 0)
                                throw new InvalidOperationException($"Preço unitário não pode ser negativo para a opção {opcao.Nome}");

                            item.SubTotal += opcao.PrecoUnitario * opcao.Quantidade;
                        }
                    }
                }

                pedido.Itens.Add(item);

                pedido.SubTotal = pedido.Itens.Sum(i => i.SubTotal);
                pedido.ValorTotal = pedido.SubTotal + pedido.TaxaEntrega - pedido.Desconto;

                await _context.SaveChangesAsync();
                await _hubContext.Clients.Group("OrderMonitors").SendAsync("NewOrder", pedido);

                return item;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar item do pedido: {Message}", ex.Message);
                throw;
            }
        }*/
        /*public async Task<ItemPedido> AtualizarQuantidade(int id, int quantidade)
        {
            var item = await _context.ItensPedido.FindAsync(id);
            if (item == null) return null;

            item.Quantidade = quantidade;
            item.SubTotal = item.PrecoUnitario * quantidade;
            await _context.SaveChangesAsync();
            await AtualizarValorTotalPedido(item.PedidoId);

            return item;
        }*/

        public async Task<ItemPedido> AtualizarObservacoes(int id, string observacoes)
        {
            var item = await _context.ItensPedido.FindAsync(id);
            if (item == null) return null;

            item.Observacoes = observacoes;
            await _context.SaveChangesAsync();

            return item;
        }

        /*public async Task<ItemPedido> AtualizarOpcoesExtras(int id, Dictionary<string, List<OpcoesItemPedido>> opcoes)
        {
            var item = await _context.ItensPedido.Include(i => i.Pedido).FirstOrDefaultAsync(i => i.Id == id);
            if (item == null) return null;

            item.SetOpcoesExtras(opcoes);
            await _context.SaveChangesAsync();
            await AtualizarValorTotalPedido(item.PedidoId);

            return item;
        }*/

        /*public async Task<bool> RemoverItemPedido(int id)
        {
            var item = await _context.ItensPedido.FindAsync(id);
            if (item == null) return false;

            int pedidoId = item.PedidoId;
            _context.ItensPedido.Remove(item);
            await _context.SaveChangesAsync();
            await AtualizarValorTotalPedido(pedidoId);

            return true;
        }*/
        public async Task DeleteAll()
        {
            var pedidos = _context.Pedidos.ToList();

            if (!pedidos.Any()) return;

            _context.Pedidos.RemoveRange(pedidos);
            await _context.SaveChangesAsync();
        }
    }
}
