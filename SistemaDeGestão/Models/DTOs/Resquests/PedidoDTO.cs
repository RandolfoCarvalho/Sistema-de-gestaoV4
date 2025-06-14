using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Resquests;

public class PedidoDTO
{
    public string FinalUserName { get; set; }
    public string FinalUserTelefone { get; set; }
    public int? FinalUserId { get; set; }
    public OrderStatus Status { get; set; }
    public string? Numero { get; set; }
    public EnderecoEntregaDTO Endereco { get; set; }
    public PagamentoDTO Pagamento { get; set; }
    public string Observacoes { get; set; }
    public string NomeDaLoja { get; set; }
    public int RestauranteId { get; set; }
    public List<ItemPedidoDTO> Itens { get; set; }

}