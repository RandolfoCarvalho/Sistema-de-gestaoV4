using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestao.Models
{
    public class GrupoAdicional
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "O nome do grupo é obrigatório")]
        [StringLength(100, ErrorMessage = "O nome não pode exceder 100 caracteres")]
        public string Nome { get; set; }

        public bool Ativo { get; set; } = true;

        public int? LimiteSelecao { get; set; }

        public virtual ICollection<Adicional> Adicionais { get; set; }
        public virtual ICollection<ProdutoGrupoAdicional> ProdutosGruposAdicionais { get; set; }
        public int RestauranteId { get; set; }
        [ForeignKey("RestauranteId")]
        public virtual Restaurante Restaurante { get; set; }

        public GrupoAdicional()
        {
            Adicionais = new List<Adicional>();
            ProdutosGruposAdicionais = new List<ProdutoGrupoAdicional>();
        }
    }
}
