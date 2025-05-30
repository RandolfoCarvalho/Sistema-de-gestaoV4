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

        public async Task<bool> UpdateProfileAsync(Restaurante restauranteExistente, Restaurante restauranteAtualizado)
        {
            if (restauranteExistente == null) return false;

            // Atualiza propriedades do Restaurante
            restauranteExistente.UserName = restauranteAtualizado.UserName ?? restauranteExistente.UserName;
            restauranteExistente.PhoneNumber = restauranteAtualizado.PhoneNumber ?? restauranteExistente.PhoneNumber;
            restauranteExistente.EmailAddress = restauranteAtualizado.EmailAddress ?? restauranteExistente.EmailAddress;
            restauranteExistente.NomeDaLoja = restauranteAtualizado.NomeDaLoja ?? restauranteExistente.NomeDaLoja;

            if (!string.IsNullOrEmpty(restauranteAtualizado.Password))
            {
                restauranteExistente.Password = ComputeSha256Hash(restauranteAtualizado.Password);
            }

            // Atualiza propriedades da Empresa, incluindo DiasFuncionamento
            if (restauranteAtualizado.Empresa != null)
            {
                if (restauranteExistente.Empresa == null)
                {
                    // Se a empresa não existir, cria uma nova.
                    // Isso pode depender da sua lógica de negócios (se uma empresa sempre deve existir ou pode ser criada aqui).
                    restauranteExistente.Empresa = new Empresa { RestauranteId = restauranteExistente.Id };
                    _context.Empresas.Add(restauranteExistente.Empresa); // Adiciona ao contexto se for nova
                }

                var empresaExistente = restauranteExistente.Empresa;
                var empresaAtualizada = restauranteAtualizado.Empresa;

                empresaExistente.CNPJ = empresaAtualizada.CNPJ ?? empresaExistente.CNPJ;
                empresaExistente.CPF = empresaAtualizada.CPF ?? empresaExistente.CPF;
                empresaExistente.RazaoSocial = empresaAtualizada.RazaoSocial ?? empresaExistente.RazaoSocial;
                empresaExistente.NomeFantasia = empresaAtualizada.NomeFantasia ?? empresaExistente.NomeFantasia;
                empresaExistente.Endereco = empresaAtualizada.Endereco ?? empresaExistente.Endereco;
                empresaExistente.Bairro = empresaAtualizada.Bairro ?? empresaExistente.Bairro;
                empresaExistente.Cidade = empresaAtualizada.Cidade ?? empresaExistente.Cidade;
                empresaExistente.Estado = empresaAtualizada.Estado ?? empresaExistente.Estado;
                empresaExistente.Cep = empresaAtualizada.Cep ?? empresaExistente.Cep;
                empresaExistente.Observacoes = empresaAtualizada.Observacoes ?? empresaExistente.Observacoes;

                if (empresaAtualizada.HorarioAbertura != TimeSpan.Zero)
                    empresaExistente.HorarioAbertura = empresaAtualizada.HorarioAbertura;
                if (empresaAtualizada.HorarioFechamento != TimeSpan.Zero)
                    empresaExistente.HorarioFechamento = empresaAtualizada.HorarioFechamento;

                // Atualiza os dias de funcionamento
                if (empresaAtualizada.DiasFuncionamento != null)
                {
                    if (empresaExistente.DiasFuncionamento == null)
                    {
                        empresaExistente.DiasFuncionamento = new DiasFuncionamento();
                    }
                    empresaExistente.DiasFuncionamento.Domingo = empresaAtualizada.DiasFuncionamento.Domingo;
                    empresaExistente.DiasFuncionamento.Segunda = empresaAtualizada.DiasFuncionamento.Segunda;
                    empresaExistente.DiasFuncionamento.Terca = empresaAtualizada.DiasFuncionamento.Terca;
                    empresaExistente.DiasFuncionamento.Quarta = empresaAtualizada.DiasFuncionamento.Quarta;
                    empresaExistente.DiasFuncionamento.Quinta = empresaAtualizada.DiasFuncionamento.Quinta;
                    empresaExistente.DiasFuncionamento.Sexta = empresaAtualizada.DiasFuncionamento.Sexta;
                    empresaExistente.DiasFuncionamento.Sabado = empresaAtualizada.DiasFuncionamento.Sabado;
                }
            }

            // Marca a entidade Restaurante como modificada (se não estiver usando tracking padrão ou para ser explícito)
            _context.Entry(restauranteExistente).State = EntityState.Modified;
            if (restauranteExistente.Empresa != null)
            {
                _context.Entry(restauranteExistente.Empresa).State = EntityState.Modified;
                // Se DiasFuncionamento for uma entidade separada, marque-a também.
                // Se for um Owned Type, o EF Core geralmente lida com isso ao marcar a entidade proprietária (Empresa).
                if (restauranteExistente.Empresa.DiasFuncionamento != null && !(_context.Entry(restauranteExistente.Empresa.DiasFuncionamento).State == EntityState.Unchanged))
                {
                    // Se DiasFuncionamento for uma entidade rastreada separadamente e não for um tipo aninhado (owned type)
                    // _context.Entry(restauranteExistente.Empresa.DiasFuncionamento).State = EntityState.Modified;
                }
            }


            await _context.SaveChangesAsync(); // Salva todas as alterações no banco
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
            // Verifica se a empresa ou os dias de funcionamento são nulos
            if (empresa == null || empresa.DiasFuncionamento == null) return false;

            // Define o fuso horário do Brasil (Horário de Brasília)
            // "E. South America Standard Time" é para Windows. Para Linux/macOS, pode ser "America/Sao_Paulo".
            // É mais robusto usar TimeZoneConverter para compatibilidade multiplataforma se necessário.
            // TimeZoneInfo brasilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time");
            // Para maior portabilidade:
            TimeZoneInfo brasilTimeZone;
            try
            {
                brasilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo"); // Padrão IANA para Linux/macOS
            }
            catch (TimeZoneNotFoundException)
            {
                brasilTimeZone = TimeZoneInfo.FindSystemTimeZoneById("E. South America Standard Time"); // Fallback para Windows
            }

            DateTime dataHoraBrasil = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, brasilTimeZone);
            DayOfWeek diaDaSemanaAtual = dataHoraBrasil.DayOfWeek;
            TimeSpan horarioAtual = dataHoraBrasil.TimeOfDay;

            bool abertoNoDiaDeHoje = false;

            // Verifica se o restaurante está configurado para abrir no dia atual da semana
            switch (diaDaSemanaAtual)
            {
                case DayOfWeek.Sunday:
                    abertoNoDiaDeHoje = empresa.DiasFuncionamento.Domingo;
                    break;
                case DayOfWeek.Monday:
                    abertoNoDiaDeHoje = empresa.DiasFuncionamento.Segunda;
                    break;
                case DayOfWeek.Tuesday:
                    abertoNoDiaDeHoje = empresa.DiasFuncionamento.Terca;
                    break;
                case DayOfWeek.Wednesday:
                    abertoNoDiaDeHoje = empresa.DiasFuncionamento.Quarta;
                    break;
                case DayOfWeek.Thursday:
                    abertoNoDiaDeHoje = empresa.DiasFuncionamento.Quinta;
                    break;
                case DayOfWeek.Friday:
                    abertoNoDiaDeHoje = empresa.DiasFuncionamento.Sexta;
                    break;
                case DayOfWeek.Saturday:
                    abertoNoDiaDeHoje = empresa.DiasFuncionamento.Sabado;
                    break;
            }

            if (!abertoNoDiaDeHoje)
            {
                return false; // Se não está configurado para abrir hoje, retorna fechado.
            }

            // Se está configurado para abrir hoje, então verifica o horário.
            TimeSpan abertura = empresa.HorarioAbertura;
            TimeSpan fechamento = empresa.HorarioFechamento;

            // Lógica para verificar se está dentro do horário de funcionamento
            if (abertura <= fechamento)
            {
                // Horário de funcionamento no mesmo dia (ex: 08:00 - 18:00)
                return horarioAtual >= abertura && horarioAtual <= fechamento;
            }
            else
            {
                // Horário de funcionamento cruza a meia-noite (ex: 22:00 - 02:00)
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
