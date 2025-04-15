namespace SistemaDeGestão.Models.DTOs.Resquests
{
    public class RestauranteDTO
    {
        public int Id { get; set; }
        public string Nome { get; set; }
        public string Slug { get; set; }
        public string Descricao { get; set; }
        public string LogoUrl { get; set; }
        public List<Categoria> Categorias { get; set; }
    }
}
