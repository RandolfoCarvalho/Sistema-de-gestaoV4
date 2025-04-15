using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SistemaDeGestão.Models.DTOs;

namespace SistemaDeGestão.Models
{
    public class Produto
    {
        [Key]
        public int Id { get; set; }

        [StringLength(100)]
        public string Nome { get; set; }

        [StringLength(500)]
        public string? Descricao { get; set; }

        public int CategoriaId { get; set; }

        [ForeignKey("CategoriaId")]
        public virtual Categoria Categoria { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoCusto { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoVenda { get; set; }

        public int EstoqueAtual { get; set; }
        public int EstoqueMinimo { get; set; }

        public string? UnidadeMedida { get; set; }  // UN, KG, L

        // Status
        public bool Ativo { get; set; } = true;

        // Data
        public DateTime DataCadastro { get; set; }

        // Imagem
        public string? ImagemPrincipalUrl { get; set; }

        public int LojaId { get; set; }

        [ForeignKey("LojaId")]
        public virtual Restaurante Restaurante { get; set; }

        // Relacionamentos essenciais
        public virtual ICollection<ProdutoComplemento>? Complementos { get; set; }
        public virtual ICollection<ProdutoAdicional>? Adicionais { get; set; }
        public virtual ICollection<ProdutoGrupoComplemento>? ProdutosGruposComplementos { get; set; }
        public virtual ICollection<ProdutoGrupoAdicional>? ProdutosGruposAdicionais { get; set; }

        public Produto()
        {
            DataCadastro = DateTime.Now;
            Complementos = new List<ProdutoComplemento>();
            Adicionais = new List<ProdutoAdicional>();
            ProdutosGruposComplementos = new List<ProdutoGrupoComplemento>();
            ProdutosGruposAdicionais = new List<ProdutoGrupoAdicional>();
        }
    }

    public class Categoria
    {
        public int Id { get; set; }

        public string Nome { get; set; }

        public int RestauranteId { get; set; }

        [ForeignKey("RestauranteId")]
        public virtual Restaurante Restaurante { get; set; }
    }
}
