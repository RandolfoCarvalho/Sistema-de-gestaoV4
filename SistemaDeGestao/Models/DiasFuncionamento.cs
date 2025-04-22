namespace SistemaDeGestao.Models
{
    public class DiasFuncionamento
    {
        public int Id { get; set; }
        public bool Domingo { get; set; } = false;
        public bool Segunda { get; set; } = true;
        public bool Terca { get; set; } = true;
        public bool Quarta { get; set; } = true;
        public bool Quinta { get; set; } = true;
        public bool Sexta { get; set; } = true;
        public bool Sabado { get; set; } = false;
    }
}
