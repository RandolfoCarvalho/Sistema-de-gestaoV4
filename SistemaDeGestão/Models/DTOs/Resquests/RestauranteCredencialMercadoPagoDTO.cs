using System.ComponentModel.DataAnnotations;

namespace SistemaDeGestão.Models.DTOs.Resquests
{
    public class RestauranteCredencialMercadoPagoDTO
    {
        public int RestauranteId { get; set; }
        public string PublicKey { get; set; }
        public string AccessToken { get; set; }
        public string ClientId { get; set; }
        public string ClientSecret { get; set; }
        public bool Ativo { get; set; }
    }
}
