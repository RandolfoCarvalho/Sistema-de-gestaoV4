namespace SistemaDeGestao.Models.DTOs.Resquests
{
    public class PagamentoDTO
    {
        public decimal SubTotal { get; set; }
        public string TransactionId { get; set; }
        
        public decimal TaxaEntrega { get; set; }
        public decimal Desconto { get; set; }
        public decimal TrocoPara { get; set; }
        public decimal ValorTotal { get; set; }
        public string FormaPagamento { get; set; }
    }
}
