using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestão.Models
{
    public class ProdutoComplemento
    {
        public int Id { get; set; }
        public int ProdutoId { get; set; }
        public int ComplementoId { get; set; }
        public bool Obrigatorio { get; set; }
        public int? MaximoPorProduto { get; set; }
        public virtual Produto Produto { get; set; }
        public virtual Complemento Complemento { get; set; }

    }
}
