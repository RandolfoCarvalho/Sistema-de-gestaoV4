namespace SistemaDeGestao.Models.DTOs.Resquests
{
    public class PagamentoPixDTO
    {
        public decimal Amount { get; set; }
        public string PayerEmail { get; set; }
        public string PayerFirstName { get; set; }  
        public string PayerLastName { get; set; }  
    }
}
