namespace SistemaDeGestão.Models.DTOs.Responses
{
    public class ComplementoResponseDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Descricao { get; set; }
        public decimal Preco { get; set; } // Supondo que Complemento tenha Preco
        public bool Ativo { get; set; }
        public int? MaximoPorProduto { get; set; } 
    }
}
