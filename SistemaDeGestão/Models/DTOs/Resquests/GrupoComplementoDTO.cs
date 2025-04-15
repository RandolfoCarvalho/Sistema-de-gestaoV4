using System.Text.Json.Serialization;

namespace SistemaDeGestão.Models.DTOs.Resquests
{
    public class GrupoComplementoDTO
    {
        [JsonPropertyName("GrupoComplementoId")]
        public int GrupoComplementoId { get; set; }
    }
}
