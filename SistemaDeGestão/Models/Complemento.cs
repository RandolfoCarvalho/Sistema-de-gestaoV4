using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SistemaDeGestao.Models
{
    public class Complemento
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [StringLength(500)]
        public string Descricao { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal Preco { get; set; }

        public bool Ativo { get; set; } = true;

        public int? MaximoPorProduto { get; set; }

        // Exemplo: um complemento pode pertencer a um grupo 
        // (ex: "Tipos de Pão", "Tipos de Molho", etc)
        public int? GrupoComplementoId { get; set; }

        [ForeignKey("GrupoComplementoId")]
        public virtual GrupoComplemento GrupoComplemento { get; set; }

        // Controle de estoque para complementos
        public int? EstoqueAtual { get; set; }

        public DateTime DataCadastro { get; set; }

        // Relacionamento com produtos
        [JsonIgnore]
        public virtual ICollection<ProdutoComplemento> Produtos { get; set; }

        public Complemento()
        {
            DataCadastro = DateTime.Now;
            Produtos = new List<ProdutoComplemento>();
        }
    }
}
