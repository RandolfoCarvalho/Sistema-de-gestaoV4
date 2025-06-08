using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestao.Models
{
    public class GrupoComplemento
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        public string Descricao { get; set; }

        public bool Ativo { get; set; } = true;
        public bool MultiplaEscolha { get; set; } = false;

        // Define se é obrigatório escolher algum complemento deste grupo
        public bool Obrigatorio { get; set; }

        // Quantidade mínima e máxima de complementos que podem ser selecionados
        public int? QuantidadeMinima { get; set; }
        public int? QuantidadeMaxima { get; set; }

        public virtual ICollection<Complemento> Complementos { get; set; }
        public virtual ICollection<ProdutoGrupoComplemento> ProdutosGruposComplementos { get; set; }
        public int RestauranteId { get; set; }
        [ForeignKey("RestauranteId")]
        public virtual Restaurante Restaurante { get; set; }

        public GrupoComplemento()
        {
            Complementos = new List<Complemento>();
            ProdutosGruposComplementos = new List<ProdutoGrupoComplemento>();
        }
    }
}
