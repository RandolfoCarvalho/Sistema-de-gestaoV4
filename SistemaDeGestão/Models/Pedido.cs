using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestão.Models
{
    public class Pedido
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string Numero { get; set; }

        public DateTime DataPedido { get; set; }

        [Required]
        public OrderStatus Status { get; set; }

        // Cliente associado ao pedido
        public int? FinalUserId { get; set; }

        [ForeignKey("FinalUserId")]
        public virtual FinalUser FinalUser { get; set; }

        // Dados de cliente anônimo
        public string FinalUserName { get; set; }
        public string FinalUserTelefone { get; set; }

        // Endereço de entrega
        public EnderecoEntrega EnderecoEntrega { get; set; }

        // Informações do restaurante
        public string NomeDaLoja { get; set; }
        public int RestauranteId { get; set; }

        [ForeignKey("RestauranteId")]
        public virtual Restaurante Restaurante { get; set; }

        // Detalhes de pagamento
        public PedidoPagamento Pagamento { get; set; }

        // Itens do pedido

        public virtual ICollection<ItemPedido> Itens { get; set; }

        public string Observacoes { get; set; }

        public Pedido()
        {
            DataPedido = DateTime.Now;
            Status = OrderStatus.NOVO;
            EnderecoEntrega = new EnderecoEntrega();
            Pagamento = new PedidoPagamento();
        }

        public void AdicionarItem(ItemPedido item)
        {
            Itens.Add(item);
            RecalcularValores();
        }

        public void RemoverItem(int itemId)
        {
            var item = Itens.FirstOrDefault(i => i.Id == itemId);
            if (item != null)
            {
                Itens.Remove(item);
                RecalcularValores();
            }
        }

        public void AtualizarStatus(OrderStatus novoStatus)
        {
            Status = novoStatus;
        }

        private void RecalcularValores()
        {
            Pagamento.SubTotal = Itens.Sum(i => i.SubTotal);
            Pagamento.ValorTotal = Pagamento.SubTotal + Pagamento.TaxaEntrega - Pagamento.Desconto;
        }
    }

}