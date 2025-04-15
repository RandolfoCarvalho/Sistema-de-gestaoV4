namespace SistemaDeGestão.Models.DTOs.Resquests
{
    public class ComplementoDTO
    {
        public int Id { get; set; }

        public string? Nome { get; set; }

        public string? Descricao { get; set; }

        public decimal? Preco { get; set; }

        public bool Ativo { get; set; }

        public int? MaximoPorProduto { get; set; }

        public int? GrupoComplementoId { get; set; }
    }
}
