using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestao.Models
{
    public class Adicional
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [StringLength(500)]
        public string Descricao { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoBase { get; set; }

        public bool Ativo { get; set; } = true;

        public int? MaximoPorProduto { get; set; }

        // Relacionamento com GrupoAdicional
        public int? GrupoAdicionalId { get; set; }

        [ForeignKey("GrupoAdicionalId")]
        //public virtual GrupoAdicional GrupoAdicional { get; set; }
        public GrupoAdicional GrupoAdicional { get; set; }
        public int? EstoqueAtual { get; set; }

        public DateTime DataCadastro { get; set; }

        // Relacionamento com produtos
        public virtual ICollection<ProdutoAdicional> Produtos { get; set; }

        public Adicional()
        {
            DataCadastro = DateTime.Now;
            Produtos = new List<ProdutoAdicional>();
        }
    }
}
