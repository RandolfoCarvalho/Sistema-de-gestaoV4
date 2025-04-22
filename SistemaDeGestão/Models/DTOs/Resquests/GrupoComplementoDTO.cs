using System.Text.Json.Serialization;

namespace SistemaDeGestao.Models.DTOs.Resquests
{
    public class GrupoComplementoDTO
    {
        [JsonPropertyName("GrupoComplementoId")]
        public int GrupoComplementoId { get; set; }
    }
}
