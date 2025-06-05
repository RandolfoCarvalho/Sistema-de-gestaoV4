using System.Diagnostics;

namespace SistemaDeGestao.Models.DTOs.Resquests
{
    public class PagamentoDinheiroDTO
    {
        public string FormaPagamento { get; set; }
        public decimal Amount { get; set; }
        public decimal TrocoPara { get; set; }
    }
}
