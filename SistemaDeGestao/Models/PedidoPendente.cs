namespace SistemaDeGestao.Models
{
    public class PedidoPendente
    {
        public int Id { get; set; }
        public string TransactionId { get; set; }
        public string PedidoJson { get; set; }
        public DateTime DataCriacao { get; set; }
    }
}
