using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestão.Models
{
    public class ProdutoGrupoAdicional
    {
        public int ProdutoId { get; set; }
        public virtual Produto Produto { get; set; }
        public int GrupoAdicionalId { get; set; }

        public virtual GrupoAdicional? GrupoAdicional { get; set; }
    }
}
