using Microsoft.AspNetCore.Mvc;
using SistemaDeGestão.Controllers;

namespace SistemaDeGestão.Models.DTOs.Resquests
{
    public class PagamentoCartaoDTO
    {
        public decimal Amount { get; set; }
        public string CardNumber { get; set; }
        public string ExpireMonth { get; set; }
        public string ExpireYear { get; set; }
        public string CVV { get; set; }
        public int StatusCode { get; set; }
        public string Message { get; set; }

        public DeviceIdDTO DeviceData { get; set; }
        public string PaymentMethodId { get; set; }
        public string Token { get; set; }

        /// <summary>
        /// 
        /// </summary>
        public string PayerEmail { get; set; }
        public string PayerFirstName { get; set; }
        public string PayerLastName { get; set; }

       

        public string PayerIdentificationType { get; set; }  // CPF, CNPJ, etc.
        public string PayerIdentificationNumber { get; set; } // Número do documento
        public int Installments { get; set; }
        public string IssuerId { get; set; }
    }

}
