using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using System.Text;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Amazon.S3;

namespace SistemaDeGestao.Services
{
    public class RestauranteService
    {
        private readonly DataBaseContext _context;
        private readonly IAmazonS3 _s3Client;
        public RestauranteService(DataBaseContext dataBaseContext, IAmazonS3 s3Client)
        {
            _context = dataBaseContext;
            _s3Client = s3Client;
        }

        public async Task<Restaurante> CriarUsuarioAsync(Restaurante restaurante)
        {
            try
            {
                restaurante.Password = ComputeSha256Hash(restaurante.Password);
                restaurante.refreshTokenExpiryTime = DateTime.SpecifyKind(DateTime.UtcNow.AddDays(7), DateTimeKind.Utc);

                restaurante.Empresa = new Empresa
                {
                    HorarioAbertura = new TimeSpan(8, 0, 0),
                    HorarioFechamento = new TimeSpan(18, 0, 0)
                };

                _context.Restaurantes.Add(restaurante);
                await _context.SaveChangesAsync();
                return restaurante;
            }
            catch (Exception ex)
            {
                // Capturar a exceção interna para obter detalhes mais específicos
                var innerException = ex.InnerException?.Message ?? ex.Message;
                throw new Exception("Erro ao criar novo usuário: " + innerException);
            }
        }

        public async Task<bool> UpdateProfileAsync(Restaurante restaurante, Restaurante updatedRestaurante)
        {
            if (restaurante == null) return false;

            restaurante.UserName = updatedRestaurante.UserName ?? restaurante.UserName;
            restaurante.PhoneNumber = updatedRestaurante.PhoneNumber ?? restaurante.PhoneNumber;
            restaurante.EmailAddress = updatedRestaurante.EmailAddress ?? restaurante.EmailAddress;
            restaurante.NomeDaLoja = updatedRestaurante.NomeDaLoja ?? restaurante.NomeDaLoja;

            if (!string.IsNullOrEmpty(updatedRestaurante.Password))
                restaurante.Password = ComputeSha256Hash(updatedRestaurante.Password);

            if (updatedRestaurante.Empresa != null && restaurante.Empresa != null)
            {
                var empresa = restaurante.Empresa;
                empresa.CNPJ = updatedRestaurante.Empresa.CNPJ ?? empresa.CNPJ;
                empresa.CPF = updatedRestaurante.Empresa.CPF ?? empresa.CPF;
                empresa.RazaoSocial = updatedRestaurante.Empresa.RazaoSocial ?? empresa.RazaoSocial;
                empresa.NomeFantasia = updatedRestaurante.Empresa.NomeFantasia ?? empresa.NomeFantasia;
                empresa.Endereco = updatedRestaurante.Empresa.Endereco ?? empresa.Endereco;
                empresa.Bairro = updatedRestaurante.Empresa.Bairro ?? empresa.Bairro;
                empresa.Cidade = updatedRestaurante.Empresa.Cidade ?? empresa.Cidade;
                empresa.Estado = updatedRestaurante.Empresa.Estado ?? empresa.Estado;
                empresa.Cep = updatedRestaurante.Empresa.Cep ?? empresa.Cep;
                empresa.Observacoes = updatedRestaurante.Empresa.Observacoes ?? empresa.Observacoes;

                if (updatedRestaurante.Empresa.HorarioAbertura != TimeSpan.Zero)
                    empresa.HorarioAbertura = updatedRestaurante.Empresa.HorarioAbertura;
                if (updatedRestaurante.Empresa.HorarioFechamento != TimeSpan.Zero)
                    empresa.HorarioFechamento = updatedRestaurante.Empresa.HorarioFechamento;

                // Atualiza os dias de funcionamento, se fornecidos
                if (updatedRestaurante.Empresa.DiasFuncionamento != null)
                {
                    empresa.DiasFuncionamento.Domingo = updatedRestaurante.Empresa.DiasFuncionamento.Domingo;
                    empresa.DiasFuncionamento.Segunda = updatedRestaurante.Empresa.DiasFuncionamento.Segunda;
                    empresa.DiasFuncionamento.Terca = updatedRestaurante.Empresa.DiasFuncionamento.Terca;
                    empresa.DiasFuncionamento.Quarta = updatedRestaurante.Empresa.DiasFuncionamento.Quarta;
                    empresa.DiasFuncionamento.Quinta = updatedRestaurante.Empresa.DiasFuncionamento.Quinta;
                    empresa.DiasFuncionamento.Sexta = updatedRestaurante.Empresa.DiasFuncionamento.Sexta;
                    empresa.DiasFuncionamento.Sabado = updatedRestaurante.Empresa.DiasFuncionamento.Sabado;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }
        public async Task<string> UploadImagemParaS3(IFormFile imagem, string NomeDaLoja, string? imagemAnteriorUrl)
        {
            var fileTransferUtility = new TransferUtility(_s3Client);

            //Se houver uma URL da imagem anterior, excluímos a imagem do S3
            if (!string.IsNullOrEmpty(imagemAnteriorUrl))
            {
                var imagemAnteriorKey = imagemAnteriorUrl?.Replace("https://sistemadegestao.s3.us-east-1.amazonaws.com/", "");

                if (!string.IsNullOrEmpty(imagemAnteriorKey))
                {
                    var deleteRequest = new DeleteObjectRequest
                    {
                        BucketName = "sistemadegestao",
                        Key = imagemAnteriorKey
                    };
                    await _s3Client.DeleteObjectAsync(deleteRequest);
                }
            }

            using (var newMemoryStream = new MemoryStream())
            {
                imagem.CopyTo(newMemoryStream);
                var currentDate = DateTime.Now.ToString("yyyyMMdd-HHmmss");
                var imageFileName = $"Imagem_{currentDate}-" + Path.GetExtension(imagem.FileName);
                var key = $"lojas/{NomeDaLoja}/{imageFileName}";
                var uploadRequest = new TransferUtilityUploadRequest
                {
                    InputStream = newMemoryStream,
                    Key = key,
                    BucketName = "sistemadegestao",
                };
                await fileTransferUtility.UploadAsync(uploadRequest);
                return $"https://sistemadegestao.s3.us-east-1.amazonaws.com/{key}";
            }
        }

        public bool IsLojaOpen(Empresa empresa)
        {
            if (empresa == null) return false;

            TimeSpan horarioAtual = DateTime.Now.TimeOfDay;
            TimeSpan abertura = empresa.HorarioAbertura;
            TimeSpan fechamento = empresa.HorarioFechamento;

            // Se abertura for antes do fechamento (mesmo dia)
            if (abertura <= fechamento)
            {
                return horarioAtual >= abertura && horarioAtual <= fechamento;
            }
            else
            {
                // Caso o horário de funcionamento cruze a meia-noite (ex: 22:00 até 02:00)
                return horarioAtual >= abertura || horarioAtual <= fechamento;
            }
        }

        public async Task<Restaurante?> GetRestauranteByUserIdAsync(ClaimsPrincipal user)
        {
            var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return null;

            return await _context.Restaurantes
                .Include(r => r.Empresa)
                .FirstOrDefaultAsync(r => r.Id.ToString() == userId);
        }

        private string ComputeSha256Hash(string rawData)
        {
            using (SHA256 sha256Hash = SHA256.Create())
            {
                byte[] bytes = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(rawData));
                StringBuilder builder = new StringBuilder();
                foreach (byte b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }
}
