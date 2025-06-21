using AutoMapper;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs;
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
            IQueryable<Pedido> query = _context.Pedidos
                .Include(p => p.EnderecoEntrega)
                .Include(p => p.Pagamento)
                .Include(p => p.FinalUser)
                .Include(p => p.Restaurante)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.OpcoesExtras)
                .AsNoTracking();

            if (status.HasValue)
            {
                query = query.Where(p => p.Status == status.Value);
            }

            return await query.OrderByDescending(p => p.DataPedido).Take(100).ToListAsync();
        }

        public async Task<Pedido> AtualizarStatusPedidoAsync(int id, OrderStatus novoStatus)
        {
            var pedido = await _context.Pedidos.FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null) return null;
            pedido.Status = novoStatus;
            _context.Entry(pedido).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ReceiveOrderStatusUpdate", pedido.Id, novoStatus.ToString());
            return pedido;
        }

        public async Task<Pedido> ObterPedido(int id)
        {
            var pedido = await _context.Pedidos
                .AsNoTracking()
                .Include(p => p.Itens).ThenInclude(i => i.Produto)
                .Include(p => p.Itens).ThenInclude(i => i.OpcoesExtras)
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
                .FirstOrDefaultAsync(p => p.Id == id && p.RestauranteId == restauranteId);
        }

        /// <summary>
        /// BOA PRÁTICA: Cria um novo pedido de forma segura.
        /// IGNORA os preços do DTO e RECALCULA tudo com base nos dados do banco.
        /// Executa todas as operações dentro de uma transação para garantir atomicidade.
        /// </summary>
        public async Task<Pedido> CriarPedidoAsync(PedidoDTO pedidoDTO)
        {
            if (pedidoDTO == null || !pedidoDTO.Itens.Any())
                throw new ArgumentException("O pedido deve conter pelo menos um item.");

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var empresa = await _context.Empresas
                    .AsNoTracking()
                    .Include(e => e.DiasFuncionamento)
                    .FirstOrDefaultAsync(e => e.RestauranteId == pedidoDTO.RestauranteId);

                if (empresa == null || !_restauranteService.IsLojaOpen(empresa))
                    throw new InvalidOperationException("A loja está fechada ou indisponível.");

                var pedido = _mapper.Map<Pedido>(pedidoDTO);

                await ValidarERecalcularPedido(pedido, pedidoDTO);

                pedido.Numero = GerarNumeroPedido();
                pedido.Status = OrderStatus.NOVO;

                if (pedido.Pagamento.FormaPagamento == "dinheiro")
                {
                    pedido.Pagamento.PagamentoAprovado = true;
                    pedido.Pagamento.DataAprovacao = DateTime.UtcNow;
                    pedido.Pagamento.TransactionId ??= $"DINHEIRO-{Guid.NewGuid().ToString().Substring(0, 8)}";
                }

                _context.Pedidos.Add(pedido);
                await _context.SaveChangesAsync();

                await ReduzirEstoqueAsync(pedido);
                await _context.SaveChangesAsync();

                await transaction.CommitAsync();

                await NotificarNovoPedido(pedido.Id);

                return pedido;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Falha crítica ao criar pedido. Transação revertida.");
                throw;
            }
        }

        /// <summary>
        /// Método central para validação e recálculo seguro do pedido.
        /// valida e precifica produtos, adicionais e complementos
        /// usando os valores do banco de dados, ignorando qualquer preço enviado pelo cliente.
        /// </summary>
        private async Task ValidarERecalcularPedido(Pedido pedido, PedidoDTO pedidoDTO)
        {
            decimal subTotalPedido = 0;

            // --- PASSO 1: Coletar todos os IDs ---

            var todosProdutoIds = pedido.Itens.Select(i => i.ProdutoId).ToList();
            var todosAdicionalIds = new List<int>();
            var todosComplementoIds = new List<int>();

            foreach (var item in pedido.Itens)
            {
                if (item.OpcoesExtras == null) continue;

                todosAdicionalIds.AddRange(item.OpcoesExtras
                    .Where(o => o.TipoOpcao == TipoOpcaoExtra.Adicional)
                    .Select(o => o.ReferenciaId));

                todosComplementoIds.AddRange(item.OpcoesExtras
                    .Where(o => o.TipoOpcao == TipoOpcaoExtra.Complemento)
                    .Select(o => o.ReferenciaId));
            }

            // Distinct para evitar buscar o mesmo ID múltiplas vezes
            todosAdicionalIds = todosAdicionalIds.Distinct().ToList();
            todosComplementoIds = todosComplementoIds.Distinct().ToList();


            // --- PASSO 2: Buscar todos os dados necessários do banco de uma só vez ---

            var produtosDoBanco = await _context.Produtos
                .AsNoTracking()
                .Where(p => todosProdutoIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            var adicionaisDoBanco = await _context.Adicionais
                .AsNoTracking()
                .Where(a => todosAdicionalIds.Contains(a.Id))
                .ToDictionaryAsync(a => a.Id);

            var complementosDoBanco = await _context.Complementos
                .AsNoTracking()
                .Where(c => todosComplementoIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id);


            // --- PASSO 3: Validar e recalcular cada item com os dados seguros do banco ---

            foreach (var item in pedido.Itens)
            {
                // Validação do produto principal
                if (!produtosDoBanco.TryGetValue(item.ProdutoId, out var produtoDb))
                    throw new InvalidOperationException($"Produto com ID {item.ProdutoId} não encontrado ou inválido.");

                if (!produtoDb.Ativo)
                    throw new InvalidOperationException($"O produto '{produtoDb.Nome}' não está disponível.");

                if (produtoDb.EstoqueAtual < item.Quantidade)
                    throw new InvalidOperationException($"Estoque insuficiente para '{produtoDb.Nome}'.");

                // Sobrescreve os dados do item com valores seguros do banco
                item.PrecoUnitario = produtoDb.PrecoVenda;
                item.NomeProduto = produtoDb.Nome;
                item.PrecoCusto = produtoDb.PrecoCusto;
                decimal subTotalItem = item.Quantidade * item.PrecoUnitario;

                // Validação das opções extras do item
                if (item.OpcoesExtras != null && item.OpcoesExtras.Any())
                {
                    foreach (var opcao in item.OpcoesExtras)
                    {
                        if (opcao.TipoOpcao == TipoOpcaoExtra.Adicional)
                        {
                            if (!adicionaisDoBanco.TryGetValue(opcao.ReferenciaId, out var adicionalDb))
                                throw new InvalidOperationException($"Adicional com ID {opcao.ReferenciaId} não encontrado ou inválido.");

                            if (!adicionalDb.Ativo)
                                throw new InvalidOperationException($"O adicional '{adicionalDb.Nome}' não está disponível.");

                            // Sobrescreve o preço e nome com o valor seguro do banco
                            opcao.PrecoUnitario = adicionalDb.PrecoBase;
                            opcao.Nome = adicionalDb.Nome;
                            subTotalItem += opcao.PrecoTotal;
                        }
                        else if (opcao.TipoOpcao == TipoOpcaoExtra.Complemento)
                        {
                            if (!complementosDoBanco.TryGetValue(opcao.ReferenciaId, out var complementoDb))
                                throw new InvalidOperationException($"Complemento com ID {opcao.ReferenciaId} não encontrado ou inválido.");

                            if (!complementoDb.Ativo)
                                throw new InvalidOperationException($"O complemento '{complementoDb.Nome}' não está disponível.");

                            // Garante que complementos não têm custo e atualiza o nome
                            opcao.PrecoUnitario = complementoDb.Preco;
                            opcao.Nome = complementoDb.Nome;
                            subTotalItem += opcao.PrecoTotal;
                        }
                    }
                }

                // Define o subtotal final do item e o acumula no total do pedido
                item.SubTotal = subTotalItem;
                subTotalPedido += item.SubTotal;
            }

            // --- PASSO 4: Calcular o valor final do pagamento ---
            var taxaEntregaReal = await _restauranteService.ObterTaxaDeEntregaAsync(pedido.RestauranteId);

            pedido.Pagamento.SubTotal = subTotalPedido;
            pedido.Pagamento.TaxaEntrega = taxaEntregaReal;
            pedido.Pagamento.Desconto = pedidoDTO.Pagamento.Desconto ?? 0;
            pedido.Pagamento.ValorTotal = pedido.Pagamento.SubTotal + pedido.Pagamento.TaxaEntrega - pedido.Pagamento.Desconto;
        }

        /// <summary>
        /// Registra o cancelamento de um pedido.
        /// </summary>
        public async Task<(bool Sucesso, string Mensagem)> RegistrarCancelamentoAsync(CancelamentoPedidoRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var pedido = await _context.Pedidos
                    .Include(p => p.Itens)
                    .FirstOrDefaultAsync(p => p.Id == request.PedidoId);

                if (pedido == null) return (false, "Pedido não encontrado.");

                pedido.Status = OrderStatus.CANCELADO;

                var pedidoCancelado = _mapper.Map<PedidoCancelado>(request);
                pedidoCancelado.DataCancelamento = DateTime.UtcNow;
                _context.PedidosCancelados.Add(pedidoCancelado);

                // Futuramente: Adicionar lógica para reverter estoque se necessário.

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                try
                {
                    await _whatsAppBot.MontarMensagemAsync(pedido);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Pedido {PedidoId} cancelado, mas falhou ao notificar via WhatsApp.", pedido.Id);
                }

                return (true, "Pedido cancelado com sucesso.");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Falha ao cancelar o pedido {PedidoId}.", request.PedidoId);
                return (false, "Erro interno ao processar o cancelamento.");
            }
        }

        private async Task ReduzirEstoqueAsync(Pedido pedido)
        {
            var produtoIds = pedido.Itens.Select(i => i.ProdutoId).ToList();
            var produtos = await _context.Produtos
                .Where(p => produtoIds.Contains(p.Id))
                .ToListAsync();

            foreach (var item in pedido.Itens)
            {
                var produto = produtos.FirstOrDefault(p => p.Id == item.ProdutoId);
                if (produto != null)
                {
                    produto.EstoqueAtual -= item.Quantidade;
                }
            }
            // As alterações serão salvas pelo SaveChangesAsync no método principal
        }

        private async Task NotificarNovoPedido(int pedidoId)
        {
            try
            {
                var pedidoCompleto = await ObterPedido(pedidoId);
                if (pedidoCompleto == null) return;

                var pedidoNotificationDto = _mapper.Map<PedidoNotificationDTO>(pedidoCompleto);
                await _hubContext.Clients.All.SendAsync("ReceiveOrderNotification", pedidoNotificationDto);
                await _whatsAppBot.MontarMensagemAsync(pedidoCompleto);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Pedido {PedidoId} criado, mas falhou ao enviar notificações.", pedidoId);
            }
        }

        private string GerarNumeroPedido()
        {
            BigInteger randomNumber = new BigInteger(Guid.NewGuid().ToByteArray().AsSpan(0, 8));
            return $"#{BigInteger.Abs(randomNumber) % 1000000:D6}";
        }

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

        public async Task<ItemPedido> AtualizarObservacoes(int id, string observacoes)
        {
            var item = await _context.ItensPedido.FindAsync(id);
            if (item == null) return null;

            item.Observacoes = observacoes;
            await _context.SaveChangesAsync();
            return item;
        }

        public async Task DeleteAll()
        {
            // Cuidado: Este método apaga TODOS os pedidos. Use apenas em ambiente de desenvolvimento.
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM [PedidosCancelados]");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM [OpcoesExtrasItemPedido]");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM [ItensPedido]");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Pagamentos]");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM [EnderecosEntrega]");
            await _context.Database.ExecuteSqlRawAsync("DELETE FROM [Pedidos]");
            _logger.LogWarning("Todos os pedidos e dados relacionados foram apagados.");
        }
    }
}