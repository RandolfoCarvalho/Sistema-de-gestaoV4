using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SistemaDeGestão.Models
{
    public class ItemPedido
    {
        [Key]
        public int Id { get; set; }
        [ForeignKey("PedidoId")]

        public int PedidoId { get; set; }

        [JsonIgnore]
        public virtual Pedido Pedido { get; set; }

        public int ProdutoId { get; set; }

        [ForeignKey("ProdutoId")]
        public virtual Produto Produto { get; set; }

        public string NomeProduto { get; set; }
        public int Quantidade { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoUnitario { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal SubTotal { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal PrecoCusto { get; set; }

        public string Observacoes { get; set; }

        public virtual ICollection<ItemPedidoOpcao> OpcoesExtras { get; set; }

        public ItemPedido()
        {
            OpcoesExtras = new List<ItemPedidoOpcao>();
        }

        public void AdicionarOpcaoExtra(int referenciaId, TipoOpcaoExtra tipo, string nome, int quantidade, decimal precoUnitario)
        {
            var opcao = new ItemPedidoOpcao
            {
                TipoOpcao = tipo,
                ReferenciaId = referenciaId,
                Nome = nome,
                Quantidade = quantidade,
                PrecoUnitario = precoUnitario
            };

            OpcoesExtras.Add(opcao);
            RecalcularSubTotal();
        }

        public void RemoverOpcaoExtra(int opcaoId)
        {
            var opcao = OpcoesExtras.FirstOrDefault(o => o.Id == opcaoId);
            if (opcao != null)
            {
                OpcoesExtras.Remove(opcao);
                RecalcularSubTotal();
            }
        }

        private void RecalcularSubTotal()
        {
            decimal valorOpcoes = OpcoesExtras.Sum(o => o.PrecoTotal);
            SubTotal = (PrecoUnitario * Quantidade) + valorOpcoes;
        }
    }

}
