using Microsoft.AspNetCore.Mvc;
using SistemaDeGestao.Controllers;

namespace SistemaDeGestao.Models.DTOs.Resquests
{
    public class PagamentoCartaoDTO
    {
        // O valor total da transação.
        public decimal Amount { get; set; }

        // O token do cartão gerado pela SDK do Mercado Pago no frontend.
        // Este é o campo mais importante.
        public string Token { get; set; }

        public DeviceIdDTO? DeviceData { get; set; }
        // O método de pagamento (ex: 'visa', 'master').
        public string? PaymentMethodId { get; set; }

        // O número de parcelas.
        public int Installments { get; set; }

        // O ID do emissor do cartão.
        public string IssuerId { get; set; }

        // --- INFORMAÇÕES DO PAGADOR ---

        public string PayerEmail { get; set; }
        public string PayerFirstName { get; set; }
        public string PayerLastName { get; set; }
        public string PayerIdentificationType { get; set; }
        public string PayerIdentificationNumber { get; set; }
    }

}


