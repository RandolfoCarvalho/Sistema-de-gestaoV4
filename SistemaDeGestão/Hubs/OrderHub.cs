using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using System;
using SistemaDeGestao.Areas.Admin.Controllers;
using SistemaDeGestao.Services;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Models;
using SistemaDeGestao.Enums;
using System.Security.Claims;
public class OrderHub : Hub
{
    private readonly ILogger<OrderHub> _logger;
    private readonly PedidoService _orderService;
    private readonly WhatsAppBotService _whatsappBot;
    private static readonly ConcurrentDictionary<string, string> _connectionGroups = new();

    public OrderHub(ILogger<OrderHub> logger, PedidoService orderService, WhatsAppBotService whatsappBot)
    {
        _logger = logger;
        _orderService = orderService;
        _whatsappBot = whatsappBot;
    }
    public async Task NewOrderNotification(PedidoDTO pedidoDTO)
    {
        // Notifica todos os clientes conectados sobre o novo pedido
        await Clients.All.SendAsync("ReceiveOrderNotification", pedidoDTO);
    }

    public async Task RequestAllOrders(int restauranteId)
    {
        try
        {
            _logger.LogInformation($"Solicitação de todos os pedidos recebida do restaurante {restauranteId} pela conexão {Context.ConnectionId}");

            var orders = await _orderService.ListarPedidosAsync(null);

            var simplifiedOrders = orders
                .Where(p => p.RestauranteId == restauranteId)
                .Select(p => new
                {
                    // Informações do Pedido
                    id = p.Id,
                    numero = p.Numero,
                    dataPedido = p.DataPedido.ToString("yyyy-MM-dd HH:mm:ss"),
                    status = p.Status.ToString(),
                    observacoes = p.Observacoes ?? "",
                    restauranteId = p.RestauranteId,

                    // --- NOVOS CAMPOS ADICIONADOS AQUI ---
                    finalUserName = p.FinalUserName,
                    finalUserTelefone = p.FinalUserTelefone,

                    // Endereço (com checagem de nulo)
                    enderecoEntrega = p.EnderecoEntrega != null ? new
                    {
                        logradouro = p.EnderecoEntrega.Logradouro,
                        numero = p.EnderecoEntrega.Numero,
                        bairro = p.EnderecoEntrega.Bairro,
                        cidade = p.EnderecoEntrega.Cidade,
                        cep = p.EnderecoEntrega.CEP,
                        complemento = p.EnderecoEntrega.Complemento
                    } : null,

                    // Pagamento (com checagem de nulo)
                    pagamento = p.Pagamento != null ? new
                    {
                        subTotal = p.Pagamento.SubTotal,
                        taxaEntrega = p.Pagamento.TaxaEntrega,
                        desconto = p.Pagamento.Desconto,
                        valorTotal = p.Pagamento.ValorTotal,
                        formaPagamento = p.Pagamento.FormaPagamento,
                        pagamentoAprovado = p.Pagamento.PagamentoAprovado,
                        dataAprovacao = p.Pagamento.DataAprovacao,
                        transactionId = p.Pagamento.TransactionId,
                        trocoPara = p.Pagamento.TrocoPara // Campo de troco
                    } : null,

                    // Lista de Itens detalhada
                    itens = p.Itens.Select(i => new
                    {
                        id = i.Id,
                        produtoId = i.ProdutoId,
                        quantidade = i.Quantidade,
                        precoUnitario = i.PrecoUnitario,
                        subTotal = i.SubTotal,
                        observacoes = i.Observacoes ?? "",
                        precoCusto = i.PrecoCusto,
                        produtoNome = i.NomeProduto,

                        // --- NOVOS CAMPOS DE CONTAGEM ADICIONADOS AQUI ---
                        totalComplementos = i.OpcoesExtras.Count(o => o.TipoOpcao == TipoOpcaoExtra.Complemento),
                        totalAdicionais = i.OpcoesExtras.Count(o => o.TipoOpcao == TipoOpcaoExtra.Adicional),

                        complementos = i.OpcoesExtras
                            .Where(o => o.TipoOpcao == TipoOpcaoExtra.Complemento)
                            .Select(o => new { nome = o.Nome })
                            .ToList(),

                        adicionais = i.OpcoesExtras
                            .Where(o => o.TipoOpcao == TipoOpcaoExtra.Adicional)
                            .Select(o => new { nome = o.Nome, preco = o.PrecoUnitario })
                            .ToList()
                    }).ToList()
                })
                .ToList();

            _logger.LogInformation($"Enviando {simplifiedOrders.Count} pedidos detalhados para {Context.ConnectionId}");

            await Clients.Caller.SendAsync("ReceiveAllOrders", simplifiedOrders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar e enviar todos os pedidos. Conexão: {ConnectionId}", Context.ConnectionId);
            await Clients.Caller.SendAsync("ReceiveError", "Erro no servidor ao buscar pedidos: " + ex.Message);
            throw;
        }
    }

    public async Task UpdateOrderStatus(int orderId, OrderStatus newStatus)
    {
        var connectionId = Context.ConnectionId;
        try
        {
            _logger.LogInformation($"UpdateOrderStatus called by {connectionId} for order {orderId} with status {newStatus}");
            if (Context.ConnectionAborted.IsCancellationRequested)
            {
                _logger.LogWarning($"Connection {connectionId} was aborted before completing UpdateOrderStatus");
                return;
            }

            // Buscar o pedido atual para ter o status anterior
            var pedidoAtual = await _orderService.ObterPedido(orderId);
            if (pedidoAtual == null)
            {
                throw new Exception($"Pedido {orderId} não encontrado");
            }

            var oldStatus = pedidoAtual.Status;

            // Atualizar o status
            await _orderService.AtualizarStatusPedidoAsync(orderId, newStatus);

            // Atualizar o objeto do pedido com o novo status
            pedidoAtual.Status = newStatus;

            // Criar objeto de atualização com todas as informações necessárias
            var statusUpdate = new OrderStatusUpdate
            {
                OrderId = orderId,
                OldStatus = oldStatus,
                NewStatus = newStatus,
                OrderNumber = pedidoAtual.Numero
            };
            await Clients.All.SendAsync("ReceiveOrderUpdate", pedidoAtual);
            await _whatsappBot.MontarMensagemAsync(pedidoAtual);
            _logger.LogInformation($"Successfully updated status for order {orderId} from {oldStatus} to {newStatus}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error in UpdateOrderStatus for connection {connectionId}, order {orderId}");
            await Clients.Caller.SendAsync("ReceiveError", "Erro ao atualizar status do pedido. Por favor, tente novamente.");
            throw;
        }
    }
}