namespace SistemaDeGestão.Models
{
    public class Empresa
    {
        public int Id { get; set; }
        public string? CNPJ { get; set; }
        public string? CPF { get; set; } 
        public string? RazaoSocial { get; set; }
        public string? NomeFantasia { get; set; }
        public string? Endereco { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? Estado { get; set; }
        public string? Cep { get; set; }
        public TimeSpan HorarioAbertura { get; set; }
        public TimeSpan HorarioFechamento { get; set; }
        public DiasFuncionamento DiasFuncionamento { get; set; } = new DiasFuncionamento();
        public string? Observacoes { get; set; }

        // Relacionamento com o Restaurante
        public int RestauranteId { get; set; }
        public virtual Restaurante Restaurante { get; set; }

        public int DiasFuncionamentoId { get; set; }
    }
}
