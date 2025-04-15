namespace SistemaDeGestão.Models.DTOs.Responses
{
    public class GrupoComplementoResponseDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Descricao { get; set; }
        public bool Ativo { get; set; }
        public bool Obrigatorio { get; set; }
        public int? QuantidadeMinima { get; set; }
        public int? QuantidadeMaxima { get; set; }
        public List<ComplementoResponseDTO> Complementos { get; set; }

        public GrupoComplementoResponseDTO()
        {
            Complementos = new List<ComplementoResponseDTO>();
        }
    }
}
