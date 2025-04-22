using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SistemaDeGestao.Models
{
    public class ItemPedidoOpcao
    {
        [Key]
        public int Id { get; set; }

        public int ItemPedidoId { get; set; }

        [ForeignKey("ItemPedidoId")]
        public virtual ItemPedido ItemPedido { get; set; }

        public TipoOpcaoExtra TipoOpcao { get; set; }
        public int ReferenciaId { get; set; }
        public string Nome { get; set; }
        public int Quantidade { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoUnitario { get; set; }

        [NotMapped]
        public decimal PrecoTotal => PrecoUnitario * Quantidade;
    }

}
