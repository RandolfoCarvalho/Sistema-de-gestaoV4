using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestao.Models
{
    public class ProdutoGrupoComplemento
    {
        public int ProdutoId { get; set; }
        public virtual Produto Produto { get; set; }
        public int GrupoComplementoId { get; set; }

        public virtual GrupoComplemento? GrupoComplemento { get; set; }
    }
}
