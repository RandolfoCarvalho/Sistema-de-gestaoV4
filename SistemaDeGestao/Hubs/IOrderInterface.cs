using SistemaDeGestao.Models;

namespace SistemaDeGestao.Hubs
{
    public interface IOrderService
    {
        Task<List<Pedido>> RequestAllOrders();
        Task<Pedido> UpdateOrderStatusAsync(int orderId, int newStatus);
        Task<Pedido> CreateOrderAsync(Pedido order);
    }
}
