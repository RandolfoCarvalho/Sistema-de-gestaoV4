using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestão.Models
{
    public class PedidoPagamento
    {
        public int Id { get; set; }
        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }
        public string TransactionId { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TaxaEntrega { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Desconto { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal ValorTotal { get; set; }

        public string FormaPagamento { get; set; }
        public bool PagamentoAprovado { get; set; }
        public DateTime? DataAprovacao { get; set; }

        public bool EhValido()
        {
            return !string.IsNullOrEmpty(FormaPagamento) && ValorTotal > 0;
        }
    }

}
