using System.ComponentModel.DataAnnotations.Schema;

namespace SistemaDeGestão.Models
{
    [Table("EnderecosEntregas")]
    public class EnderecoEntrega
    {
        public int Id { get; set; }
        public string Logradouro { get; set; }
        public string Numero { get; set; }
        public string Complemento { get; set; }
        public string Bairro { get; set; }
        public string Cidade { get; set; }
        public string CEP { get; set; }

        public bool EhValido()
        {
            return !string.IsNullOrEmpty(Logradouro) &&
                   !string.IsNullOrEmpty(Bairro) &&
                   !string.IsNullOrEmpty(Cidade) &&
                   !string.IsNullOrEmpty(CEP);
        }

        public string EnderecoCompleto()
        {
            return $"{Logradouro}, {Numero} {Complemento} - {Bairro}, {Cidade} - {CEP}";
        }
    }

}
