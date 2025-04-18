using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SistemaDeGestão.Models
{
    public class PedidoCancelado
    {
        public int Id { get; set; }

        [Required]
        public int PedidoId { get; set; }

        [ForeignKey("PedidoId")]
        public virtual Pedido Pedido { get; set; }

        [Required]
        public DateTime DataCancelamento { get; set; }

        [Required]
        public string MotivoCancelamento { get; set; }

        public string CodigoReembolso { get; set; }

        public bool EstaReembolsado { get; set; }

        public decimal ValorReembolsado { get; set; }

        public string TransacaoReembolsoId { get; set; }

        public int FinalUserId { get; set; }

        [ForeignKey("FinalUserId")]

        public virtual FinalUser FinalUser { get; set; }

        public PedidoCancelado()
        {
            DataCancelamento = DateTime.Now;
        }
    }
}
