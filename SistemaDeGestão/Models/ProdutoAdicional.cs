namespace SistemaDeGestao.Models
{
    public class ProdutoAdicional
    {
        public int Id { get; set; }
        public int ProdutoId { get; set; }
        public int AdicionalId { get; set; }
        public decimal PrecoAdicional { get; set; }
        public int? MaximoPorProduto { get; set; }
        public virtual Produto Produto { get; set; }
        public virtual Adicional Adicional { get; set; }
    }
}
