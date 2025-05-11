using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;

namespace SistemaDeGestao.Models
{
    public class ModeloMensagem
    {
        [Key]
        public int Id { get; set; }
        public int RestauranteId { get;set; }
        public int TemplateId { get; set; }

        [Required(ErrorMessage = "O título é obrigatório.")]
        [MaxLength(100)]
        public string Titulo { get; set; } // Ex: "Confirmação de Pedido"

        [Required(ErrorMessage = "O texto do template é obrigatório.")]
        public string Texto { get; set; } // Ex: "Olá {{cliente}}, seu pedido #{{pedido}} foi recebido..."

        [Required(ErrorMessage = "A etapa do pedido é obrigatória.")]
        [MaxLength(50)]
        public string Etapa { get; set; } // Ex: "Recebido", "Produção", "Entrega"

    }
}
