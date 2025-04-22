namespace SistemaDeGestao.Enums
{
    public class OrderStatusUpdate
    {
        public int OrderId { get; set; }
        public OrderStatus OldStatus { get; set; }
        public OrderStatus NewStatus { get; set; }
        public string OrderNumber { get; set; }
    }
}
