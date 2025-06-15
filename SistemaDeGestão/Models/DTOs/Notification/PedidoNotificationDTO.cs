using System;
using System.Collections.Generic;
using SistemaDeGestao.Models; 

namespace SistemaDeGestao.Models.DTOs.Notification
{
    // DTO principal que será enviado na notificação
    public class PedidoNotificationDTO
    {
        public int Id { get; set; }
        public string Numero { get; set; }
        public string DataPedido { get; set; } // string para manter o formato
        public string Status { get; set; }
        public string Observacoes { get; set; }
        public int RestauranteId { get; set; }
        public string FinalUserName { get; set; }
        public string FinalUserTelefone { get; set; }

        public EnderecoEntregaNotificationDTO EnderecoEntrega { get; set; }
        public PagamentoNotificationDTO Pagamento { get; set; }
        public List<ItemPedidoNotificationDTO> Itens { get; set; }
    }

    // DTO para o endereço
    public class EnderecoEntregaNotificationDTO
    {
        public string Logradouro { get; set; }
        public string Numero { get; set; }
        public string Bairro { get; set; }
        public string Cidade { get; set; }
        public string CEP { get; set; }
        public string Complemento { get; set; }
    }

    // DTO para o pagamento
    public class PagamentoNotificationDTO
    {
        public decimal SubTotal { get; set; }
        public decimal TaxaEntrega { get; set; }
        public decimal Desconto { get; set; }
        public decimal ValorTotal { get; set; }
        public string FormaPagamento { get; set; }
        public bool PagamentoAprovado { get; set; }
        public DateTime? DataAprovacao { get; set; }
        public string TransactionId { get; set; }
        public decimal? TrocoPara { get; set; }
    }

    // DTO para os itens do pedido
    public class ItemPedidoNotificationDTO
    {
        public int Id { get; set; }
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
        public decimal PrecoUnitario { get; set; }
        public decimal SubTotal { get; set; }
        public string Observacoes { get; set; }
        public decimal PrecoCusto { get; set; }
        public string ProdutoNome { get; set; }
        public int TotalComplementos { get; set; }
        public int TotalAdicionais { get; set; }

        public List<ComplementoNotificationDTO> Complementos { get; set; }
        public List<AdicionalNotificationDTO> Adicionais { get; set; }
    }

    // DTO específico para complementos
    public class ComplementoNotificationDTO
    {
        public string Nome { get; set; }
    }

    // DTO específico para adicionais
    public class AdicionalNotificationDTO
    {
        public string Nome { get; set; }
        public decimal Preco { get; set; }
    }
}