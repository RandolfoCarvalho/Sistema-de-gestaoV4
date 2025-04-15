using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using Microsoft.AspNetCore.Authorization;
using System;
using SistemaDeGestão.Areas.Admin.Controllers;
using SistemaDeGestão.Services;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestão.Models;
using SistemaDeGestão.Enums;
using System.Security.Claims;
public class OrderHub : Hub
{
    private readonly ILogger<OrderHub> _logger;
    private readonly PedidoService _orderService;
    private static readonly ConcurrentDictionary<string, string> _connectionGroups = new();

    public OrderHub(ILogger<OrderHub> logger, PedidoService orderService)
    {
        _logger = logger;
        _orderService = orderService;
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
            _logger.LogInformation($"Solicitação de pedidos recebida de {Context.ConnectionId}");
            // Buscar todos os pedidos
            var orders = await _orderService.ListarPedidosAsync(null);
            var simplifiedOrders = orders
                .Where(p => p.RestauranteId == restauranteId)
                .Select(p => new
                {
                    id = p.Id,
                    numero = p.Numero,
                    dataPedido = p.DataPedido.ToString("yyyy-MM-dd HH:mm:ss"),
                    status = p.Status.ToString(),
                    enderecoEntrega = p.EnderecoEntrega != null ? new
                    {
                        logradouro = p.EnderecoEntrega.Logradouro,
                        numero = p.EnderecoEntrega.Numero,
                        bairro = p.EnderecoEntrega.Bairro,
                        cidade = p.EnderecoEntrega.Cidade,
                        cep = p.EnderecoEntrega.CEP,
                        complemento = p.EnderecoEntrega.Complemento
                    } : null, // Evita erro caso o endereço seja nulo
                    valorTotal = p.Pagamento?.ValorTotal ?? 0,
                    formaPagamento = p.Pagamento?.FormaPagamento ?? "Não informado",
                    observacoes = p.Observacoes ?? "",
                    restauranteId = p.RestauranteId,
                    itens = p.Itens.Select(i => new
                    {
                        id = i.Id,
                        produtoId = i.ProdutoId,
                        quantidade = i.Quantidade,
                        precoUnitario = i.PrecoUnitario,
                        precoCusto = i.PrecoCusto,
                        subTotal = i.SubTotal,
                        observacoes = i.Observacoes ?? ""
                    }).ToList()
                })
                .ToList();
            // Loga a quantidade de pedidos enviados
            _logger.LogInformation($"Enviando {simplifiedOrders.Count} pedidos para {Context.ConnectionId}");
            // Enviar os pedidos ao cliente
            await Clients.Caller.SendAsync("ReceiveAllOrders", simplifiedOrders);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao processar pedidos");
            await Clients.Caller.SendAsync("ReceiveError", "Erro ao processar pedidos: " + ex.Message);
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