namespace SistemaDeGestao.Models.DTOs.Resquests
{
    public class AtualizarProdutoRequestDto
    {
        // Propriedades que vêm do ProdutoDTO
        public int Id { get; set; }
        public string Nome { get; set; }
        public decimal PrecoVenda { get; set; }
        public decimal PrecoCusto { get; set; }
        public string? Descricao { get; set; }
        public int CategoriaId { get; set; }
        public bool Ativo { get; set; }
        public int EstoqueAtual { get; set; }
        public int EstoqueMinimo { get; set; }
        public string? UnidadeMedida { get; set; }
        public IFormFile? ImagemPrincipalUrl { get; set; }
        public List<int> ComplementosIds { get; set; } = new List<int>();
        public List<int> AdicionaisIds { get; set; } = new List<int>();
    }
}
