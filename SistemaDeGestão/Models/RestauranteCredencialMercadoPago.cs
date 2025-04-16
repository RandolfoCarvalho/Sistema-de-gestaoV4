namespace SistemaDeGestão.Models
{
    public class RestauranteCredencialMercadoPago
    {
        public int Id { get; set; }

        // Chave estrangeira para o restaurante
        public int RestauranteId { get; set; }
        public Restaurante Restaurante { get; set; }

        public string PublicKey { get; set; }
        public string AccessToken { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }

        public DateTime DataCadastro { get; set; } = DateTime.UtcNow;
        public bool Ativo { get; set; } = false;
    }
}
