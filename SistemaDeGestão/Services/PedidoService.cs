using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Migrations;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Notification;
using SistemaDeGestao.Models.DTOs.Resquests;
using System.Numerics;

namespace SistemaDeGestao.Services
{
    public class PedidoService
    {
        private readonly DataBaseContext _context;
        private readonly ILogger<PedidoService> _logger;
        private readonly IHubContext<OrderHub> _hubContext;
        private readonly RestauranteService _restauranteService;
        private readonly IMapper _mapper;
        private readonly WhatsAppBotService _whatsAppBot;
        public PedidoService(DataBaseContext context, ILogger<PedidoService> logger, 
            IHubContext<OrderHub> hubContext, RestauranteService restauranteService, IMapper mapper, WhatsAppBotService whatsAppBot)
        {
            _context = context;
            _logger = logger;
            _hubContext = hubContext;
            _restauranteService = restauranteService;
            _mapper = mapper;
            _whatsAppBot = whatsAppBot;
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
                    // Includes principais do Pedido
                    .Include(p => p.EnderecoEntrega)
                    .Include(p => p.Pagamento)
                    .Include(p => p.FinalUser)
                    .Include(p => p.Restaurante)

                    // Includes aninhados para os Itens do Pedido
                    .Include(p => p.Itens)
                        .ThenInclude(i => i.Produto) // Para obter o nome do produto

                    // --- CORREÇÃO APLICADA AQUI ---
                    // Carrega a coleção genérica de opções extras para cada item
                    .Include(p => p.Itens)
                        .ThenInclude(i => i.OpcoesExtras)

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
                throw; // Re-lançar a exceção para ser tratada por quem chamou
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
            var pedido = await _context.Pedidos
                .AsNoTracking() 
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.FinalUser)
                .Include(p => p.EnderecoEntrega)
                .Include(p => p.Pagamento)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                throw new KeyNotFoundException($"Pedido com ID {id} não foi encontrado.");
            }
            return pedido;
        }

        public async Task<Pedido> ObterPedidoPorIdeRestauranteId(int id, int restauranteId)
        {
            return await _context.Pedidos
                .Include(p => p.Itens)
                .ThenInclude(i => i.Produto)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        /// <summary>
        /// Cria um novo pedido e envia notificação ao cliente.
        /// </summary>
        /// <param name="pedidoDTO">Dados do pedido enviado pelo cliente.</param>
        /// <returns>O pedido criado com os dados persistidos.</returns>
        public async Task<Pedido> CriarPedidoAsync(PedidoDTO pedidoDTO)
        {
            if (pedidoDTO == null || !pedidoDTO.Itens.Any())
                throw new ArgumentException("O pedido deve conter pelo menos um item.");

            var produtoIds = pedidoDTO.Itens.Select(i => i.ProdutoId).ToList();

            var produtosAtivos = await _context.Produtos
                .Where(p => produtoIds.Contains(p.Id) && p.Ativo)
                .Select(p => p.Id)
                .ToListAsync();

            var produtosInativos = produtoIds.Except(produtosAtivos).ToList();

            if (produtosInativos.Any())
                throw new InvalidOperationException("Um ou mais produtos do pedido estão indisponíveis.");
            if (pedidoDTO.Pagamento.FormaPagamento == "dinheiro")
            {
                BigInteger transactionIdTemporario = new BigInteger(Guid.NewGuid().ToByteArray().Take(4).ToArray());
                transactionIdTemporario = BigInteger.Abs(transactionIdTemporario) % 999999;
                pedidoDTO.Pagamento.TransactionId = transactionIdTemporario.ToString();
            }

            var empresa = await _context.Empresas
                .Include(e => e.DiasFuncionamento)
                .FirstOrDefaultAsync(e => e.RestauranteId == pedidoDTO.RestauranteId);
            if (empresa == null || !_restauranteService.IsLojaOpen(empresa)) return null;
            BigInteger pedidoNumber = new BigInteger(Guid.NewGuid().ToByteArray().Take(4).ToArray());
            pedidoNumber = BigInteger.Abs(pedidoNumber) % 999999;
            string numeroPedido = $"PED: {pedidoNumber:D5}";

            var pedido = _mapper.Map<Pedido>(pedidoDTO);
            pedido.Numero = numeroPedido;
            pedido.Pagamento.PagamentoAprovado = true;
            pedido.Pagamento.DataAprovacao = DateTime.UtcNow;

            // 🔐 Começa a transação
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                _context.Pedidos.Add(pedido);
                await _context.SaveChangesAsync();

                // 👇 Reduz o estoque com segurança
                await ReduzirEstoqueAsync(pedido);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
            var pedidoCompletoParaNotificacao = await _context.Pedidos
                .AsNoTracking()
                .Include(p => p.Pagamento)
                .Include(p => p.EnderecoEntrega)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.OpcoesExtras)
                .FirstOrDefaultAsync(p => p.Id == pedido.Id);

            if (pedidoCompletoParaNotificacao == null)
            {
                _logger.LogError("CRITICAL: Pedido com ID {PedidoId} não encontrado imediatamente após a criação.", pedido.Id);
                return pedido;
            }
            // MAPEAR O OBJETO COMPLETO E CORRETO para o DTO
            var pedidoNotificationDto = _mapper.Map<PedidoNotificationDTO>(pedidoCompletoParaNotificacao);
            pedidoNotificationDto.Status = OrderStatus.NOVO.ToString();
            Console.WriteLine($"[DEBUG] Status mapeado: {pedidoNotificationDto.Status}");
            pedidoNotificationDto.Numero = pedidoCompletoParaNotificacao.Numero;
            // ENVIAR O DTO CORRETO
            await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", pedidoNotificationDto);
            var result = await _whatsAppBot.MontarMensagemAsync(pedidoCompletoParaNotificacao);
            return pedido;
        }

        /// <summary>
        /// Registra o cancelamento de um pedido, atualiza seu status,
        /// salva o histórico do cancelamento e notifica o cliente via WhatsApp.
        /// </summary>
        /// <param name="request">Os dados da solicitação de cancelamento.</param>
        /// <returns>Um objeto indicando sucesso ou falha.</returns>
        public async Task<(bool Sucesso, string Mensagem)> RegistrarCancelamentoAsync(CancelamentoPedidoRequest request)
        {
            // A transação garante que todas as operações sejam atômicas: ou tudo funciona, ou nada é salvo.
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 1. Buscar o pedido original
                var pedido = await _context.Pedidos
                    .Include(p => p.Itens) // Incluir itens para o cálculo de valor ou outras lógicas
                    .FirstOrDefaultAsync(p => p.Id == request.PedidoId);

                if (pedido == null)
                {
                    return (false, "Pedido não encontrado.");
                }

                // 2. Atualizar o status do pedido para CANCELADO
                pedido.Status = OrderStatus.CANCELADO;

                // 3. Criar o registro histórico do cancelamento
                var pedidoCancelado = new PedidoCancelado
                {
                    PedidoId = request.PedidoId,
                    MotivoCancelamento = request.MotivoCancelamento,
                    CodigoReembolso = request.CodigoReembolso ?? "",
                    ValorReembolsado = request.ValorReembolsado ?? 0,
                    TransacaoReembolsoId = request.TransacaoReembolsoId,
                    EstaReembolsado = request.EstaReembolsado,
                    FinalUserId = request.FinalUserId,
                    DataCancelamento = DateTime.Now
                };

                _context.PedidosCancelados.Add(pedidoCancelado);

                // 4. Salvar as mudanças no banco de dados
                await _context.SaveChangesAsync();

                // 5. Comitar a transação, confirmando todas as operações
                await transaction.CommitAsync();

                // 6. Chamar o serviço de notificação APÓS a confirmação no banco
                // O try-catch aqui garante que uma falha no envio da mensagem não desfaça o cancelamento.
                try
                {
                    await _whatsAppBot.MontarMensagemAsync(pedido);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "O pedido {PedidoId} foi cancelado com sucesso, mas falhou ao enviar a notificação via WhatsApp.", pedido.Id);
                    // Não retorna erro ao cliente, pois a operação principal (cancelamento) foi um sucesso.
                }

                return (true, "Pedido cancelado com sucesso.");
            }
            catch (Exception ex)
            {
                // Se qualquer operação no banco falhar, desfaz tudo
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Falha crítica ao tentar cancelar o pedido {PedidoId}.", request.PedidoId);
                return (false, "Erro interno ao processar o cancelamento do pedido.");
            }
        }

        private async Task ReduzirEstoqueAsync(Pedido pedido)
        {
            foreach (var item in pedido.Itens)
            {
                var produto = await _context.Produtos.FirstOrDefaultAsync(p => p.Id == item.ProdutoId);

                if (produto == null)
                    throw new InvalidOperationException($"Produto com ID {item.ProdutoId} não encontrado.");

                if (produto.EstoqueAtual < item.Quantidade)
                    throw new InvalidOperationException($"Estoque insuficiente para o produto '{produto.Nome}'. Quantidade solicitada: {item.Quantidade}, disponível: {produto.EstoqueAtual}");

                produto.EstoqueAtual -= item.Quantidade;
                _context.Produtos.Update(produto);
            }
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
