using System.ComponentModel.DataAnnotations;

namespace SistemaDeGestao.Models.DTOs.Relatorios
{
    public class RelatorioRequestDto
    {
        [Required]
        public DateTime DataInicio { get; set; }

        [Required]
        public DateTime DataFim { get; set; }

        // Uma lista de status para filtrar. Se for nula ou vazia, consideramos todos os status.
        public List<OrderStatus>? Status { get; set; }
    }
}
