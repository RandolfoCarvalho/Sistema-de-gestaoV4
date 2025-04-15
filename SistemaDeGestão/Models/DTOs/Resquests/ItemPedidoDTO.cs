using SistemaDeGestão.Models;
using System.ComponentModel.DataAnnotations.Schema;

public class ItemPedidoDTO
{
    public int ProdutoId { get; set; }
    public string NomeProduto { get; set; }
    public int Quantidade { get; set; }
    public decimal PrecoUnitario { get; set; }
    public decimal SubTotal { get; set; }
    public string Observacoes { get; set; }
    public decimal PrecoCusto { get; set; }
    public List<ItemPedidoOpcaoDTO> OpcoesExtras { get; set; }
}
