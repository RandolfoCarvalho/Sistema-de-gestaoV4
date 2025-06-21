using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Relatorios;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Services;
using SistemaDeGestao.Services.Interfaces;
using System.Security.Claims;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class RestauranteController : Controller
    {
        private readonly DataBaseContext _context;
        private readonly RestauranteService _restauranteService;
        private readonly IEncryptionService _encryptionService;
        public RestauranteController(DataBaseContext context, RestauranteService restauranteService,
            IEncryptionService encryptionService, IAmazonS3 s3Client)
        {
            _context = context;
            _restauranteService = restauranteService;
            _encryptionService = encryptionService;
            
        }
        [HttpGet]
        public IActionResult list()
        {
            return Ok(_context.Restaurantes.ToList());
        }

        [HttpPost]
        [Route("Cadastro")]
        public async Task<IActionResult> CriarUsuario([FromBody] Restaurante Restaurante)
        {
            try
            {
               await _restauranteService.CriarUsuarioAsync(Restaurante);
            }
            catch (Exception ex)
            {
                throw new Exception($"{ex.InnerException?.Message ?? ex.Message}");
            }

            return Ok(Restaurante);
        }

        [HttpGet("isLojaOpen/{restauranteId}")]
        public IActionResult IsLojaOpen(int restauranteId)
        {
            var empresa = _context.Empresas
                .Include(e => e.DiasFuncionamento)
                .FirstOrDefault(e => e.RestauranteId == restauranteId);
            if (empresa == null) return NotFound(new { message = "Empresa não encontrada" });

            bool isOpen = _restauranteService.IsLojaOpen(empresa);
            return Ok(new { isOpen });
        }

        [HttpGet]
        [Route("GetRestauranteInfo")]
        public async Task<IActionResult> GetRestauranteInfo()
        {
            if (!User.Identity.IsAuthenticated)
            {
                return Unauthorized("Usuário não está autenticado");
            }

            var restauranteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(restauranteId))
            {
                return Unauthorized("ID do usuário não encontrado");
            }

            var restauranteModel = await _context.Restaurantes
                .Include(r => r.Empresa)
                .Include(e => e.Empresa.DiasFuncionamento)
                .FirstOrDefaultAsync(u => u.Id.ToString() == restauranteId);

            if (restauranteModel == null)
            {
                return BadRequest("Usuário não encontrado");
            }

            // Busca a credencial relacionada ao restaurante
            var credencial = await _context.RestauranteCredenciaisMercadoPago
                .FirstOrDefaultAsync(c => c.RestauranteId.ToString() == restauranteId);

            RestauranteCredencialMercadoPagoDTO credencialDTO = null;

            if (credencial != null)
            {
                credencialDTO = new RestauranteCredencialMercadoPagoDTO
                {
                    RestauranteId = credencial.RestauranteId,
                    PublicKey = _encryptionService.Decrypt(credencial.PublicKey),
                    AccessToken = _encryptionService.Decrypt(credencial.AccessToken),
                    ClientId = _encryptionService.Decrypt(credencial.ClientId),
                    ClientSecret = _encryptionService.Decrypt(credencial.ClientSecret),
                    Ativo = credencial.Ativo
                };
            }

            return Ok(new
            {
                Restaurante = restauranteModel,
                CredenciaisMercadoPago = credencialDTO
            });
        }

        [HttpGet]
        [Route("GetRestauranteInfoByName/{RestauranteName}")]
        public async Task<IActionResult> GetRestauranteInfoByName(string RestauranteName)
        {
            var RestauranteModel = await _context.Restaurantes
                .Include(r => r.Empresa)
                .Include(e => e.Empresa.DiasFuncionamento)
                .FirstOrDefaultAsync(u => u.NomeDaLoja == RestauranteName);

            if (RestauranteModel == null)
            {
                return BadRequest("Usuário não encontrado");
            }
            return Ok(RestauranteModel);
        }

        [HttpPut("UpdateProfile")]
        public async Task<IActionResult> UpdateProfile([FromBody] Restaurante updatedRestaurante)
        {
            var restaurante = await _restauranteService.GetRestauranteByUserIdAsync(User);
            if (restaurante == null)
                return BadRequest("Usuário não encontrado");
            bool updated = await _restauranteService.UpdateProfileAsync(restaurante, updatedRestaurante);
            if (!updated)
                return StatusCode(500, "Erro ao atualizar perfil");
            return Ok("Perfil atualizado com sucesso");
        }

        [HttpPut("UpdateProfileComImagem")]
        public async Task<IActionResult> UpdateProfileComImagem([FromForm] IFormFile imagemLoja, [FromForm] string restauranteJson)
        {
            var updatedRestaurante = JsonConvert.DeserializeObject<Restaurante>(restauranteJson);
            if (updatedRestaurante == null)
                return BadRequest("Dados inválidos.");
            var restauranteExistente = await _context.Restaurantes
                .Include(r => r.Empresa)
                .ThenInclude(e => e.DiasFuncionamento)
                .FirstOrDefaultAsync(r => r.Id == updatedRestaurante.Id);
            if (restauranteExistente == null)
                return NotFound("Restaurante não encontrado.");
            if (imagemLoja != null)
            {
                var novaImagemUrl = await _restauranteService.UploadImagemParaS3(imagemLoja, updatedRestaurante.NomeDaLoja, restauranteExistente.ImagemUrl);
                restauranteExistente.ImagemUrl = novaImagemUrl;
            }
            try
            {
                await _restauranteService.UpdateProfileAsync(restauranteExistente, updatedRestaurante);
                return Ok();
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
       
        [HttpGet]
        [Route("ObterRestauranteIdDoUsuarioAutenticado")]
        public IActionResult ObterRestauranteIdDoUsuarioAutenticado()
        {
            var restauranteId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (int.TryParse(restauranteId, out var restId))
            {
                return Ok(restauranteId);
            }
            return BadRequest("Usuario nao autenticado ou não encontrado");
        }

        [HttpGet("BuscarRestauranteIdPorNome/{nomeLoja}")]
        public async Task<ActionResult<int>> BuscarRestauranteIdPorNome(string nomeLoja)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(nomeLoja))
                {
                    return BadRequest("Nome da loja não pode ser vazio.");
                }
                var nomeLojaLower = nomeLoja.Trim().ToLower();
                var restaurante = await _context.Restaurantes
                    .Where(r => r.NomeDaLoja != null &&
                               r.NomeDaLoja.ToLower().Equals(nomeLojaLower))
                    .FirstOrDefaultAsync();

                if (restaurante == null)
                {
                    return NotFound($"Restaurante '{nomeLoja}' não encontrado.");
                }

                return Ok(restaurante.Id);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Erro interno ao buscar restaurante.");
            }
        }


        [HttpPost("gerarRelatorio")]
        public async Task<IActionResult> GerarRelatorio([FromBody] RelatorioRequestDto request)
        {

            var restauranteIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (restauranteIdClaim == null)
            {
                // O token não contém a claim necessária.
                return Unauthorized("A claim de identificação do restaurante não foi encontrada.");
            }
            if (string.IsNullOrEmpty(restauranteIdClaim) || !int.TryParse(restauranteIdClaim, out var restauranteId))
            {
                return BadRequest("O ID do restaurante não foi encontrado ou não é válido.");
            }

            // 1. Validação de Entrada
            if (request.DataInicio > request.DataFim)
            {
                return BadRequest("A data de início não pode ser posterior à data de fim.");
            }

            // Ajusta a data final para incluir o dia inteiro
            var dataFimAjustada = request.DataFim.Date.AddDays(1).AddTicks(-1);

            // 2. Construção da Query Base com Includes
            var query = _context.Pedidos
                .AsNoTracking()
                .Where(p => p.RestauranteId == restauranteId)
                .Include(p => p.Itens)
                .Where(p => p.DataPedido >= request.DataInicio.Date && p.DataPedido <= dataFimAjustada);

            // 3. Aplicação do Filtro de Status (se fornecido)
            if (request.Status != null && request.Status.Any())
            {
                query = query.Where(p => request.Status.Contains(p.Status));
            }

            // 4. Execução da Query
            var pedidosFiltrados = await query
               .Include(p => p.Pagamento) // Garanta que Pagamento está incluído para o ValorTotal
               .ToListAsync();

            // ==========================================================
            // NOVA SEÇÃO: Mapear os detalhes dos pedidos
            // ==========================================================
            var pedidosDetalhes = pedidosFiltrados
                .OrderByDescending(p => p.DataPedido) // Ordena os mais recentes primeiro
                .Select(p => new PedidoSimplificadoDto
                {
                    Numero = p.Numero,
                    DataPedido = p.DataPedido,
                    NomeCliente = p.FinalUserName,
                    Status = p.Status.ToString(),
                    // AQUI A MUDANÇA: 'ValorTotal' agora é o SubTotal dos produtos.
                    ValorTotal = p.Pagamento?.SubTotal ?? 0,
                    // AQUI A ADIÇÃO: Novo campo para a taxa de entrega.
                    TaxaEntrega = p.Pagamento?.TaxaEntrega ?? 0
                }).ToList();
            // 5. Agregação e Processamento dos Dados
            if (!pedidosFiltrados.Any())
            {
                return Ok(new RelatorioCompletoDto
                {
                    Summary = new RelatorioSumarioDto(),
                    DailyData = new List<RelatorioPontoDeDadoDto>(),
                    MonthlyData = new List<RelatorioPontoDeDadoDto>(),
                    StatusDistribution = new List<RelatorioStatusDto>()
                });
            }

            // ==========================================================
            // CORREÇÃO APLICADA AQUI
            // ==========================================================
            // Agrupa por dia
            var dailyData = pedidosFiltrados
                .GroupBy(p => p.DataPedido.Date) // g.Key aqui é um objeto DateTime
                .OrderBy(g => g.Key) // 1. Ordena pelo objeto DateTime real
                .Select(g => new RelatorioPontoDeDadoDto // 2. Só depois formata para o DTO
                {
                    Name = g.Key.ToString("ddd, dd/MM"), // String de exibição
                    Orders = g.Count(),
                    Revenue = g.SelectMany(p => p.Itens).Sum(i => i.SubTotal),
                    Costs = g.SelectMany(p => p.Itens).Sum(i => i.PrecoCusto * i.Quantidade),
                    Profit = g.SelectMany(p => p.Itens).Sum(i => i.SubTotal) - g.SelectMany(p => p.Itens).Sum(i => i.PrecoCusto * i.Quantidade),
                    Canceled = g.Count(p => p.Status == OrderStatus.CANCELADO)
                })
                .ToList();

            // ==========================================================
            // CORREÇÃO APLICADA AQUI
            // ==========================================================
            // Agrupa por mês
            var monthlyData = pedidosFiltrados
                .GroupBy(p => new { p.DataPedido.Year, p.DataPedido.Month }) // g.Key aqui é um objeto com Year e Month
                .OrderBy(g => g.Key.Year).ThenBy(g => g.Key.Month) // 1. Ordena pela data real
                .Select(g => new RelatorioPontoDeDadoDto // 2. Só depois formata para o DTO
                {
                    Name = new DateTime(g.Key.Year, g.Key.Month, 1).ToString("MMM, yy"), // String de exibição
                    Orders = g.Count(),
                    Revenue = g.SelectMany(p => p.Itens).Sum(i => i.SubTotal),
                    Costs = g.SelectMany(p => p.Itens).Sum(i => i.PrecoCusto * i.Quantidade),
                    Profit = g.SelectMany(p => p.Itens).Sum(i => i.SubTotal) - g.SelectMany(p => p.Itens).Sum(i => i.PrecoCusto * i.Quantidade),
                    Canceled = g.Count(p => p.Status == OrderStatus.CANCELADO)
                })
                .ToList();

            // Agrupa por status (esta parte já estava correta)
            var statusDistribution = pedidosFiltrados
                .GroupBy(p => p.Status)
                .Select(g => new RelatorioStatusDto
                {
                    Name = StatusMap.ContainsKey(g.Key) ? StatusMap[g.Key].Label : "Desconhecido",
                    Value = g.Count(),
                    Color = StatusMap.ContainsKey(g.Key) ? StatusMap[g.Key].Color : "#6B7280"
                })
                .ToList();

            // 6. Cálculo do Sumário e Insights (esta parte já estava correta)
            var summary = new RelatorioSumarioDto
            {
                TotalOrders = pedidosFiltrados.Count,
                TotalRevenue = dailyData.Sum(d => d.Revenue),
                TotalCosts = dailyData.Sum(d => d.Costs),
                TotalProfit = dailyData.Sum(d => d.Profit),
                TotalCanceled = pedidosFiltrados.Count(p => p.Status == OrderStatus.CANCELADO)
            };

            summary.AverageOrderValue = summary.TotalOrders > 0 ? summary.TotalRevenue / summary.TotalOrders : 0;
            summary.ProfitMargin = summary.TotalRevenue > 0 ? Math.Round((double)(summary.TotalProfit / summary.TotalRevenue) * 100, 2) : 0;
            summary.CancellationRate = summary.TotalOrders > 0 ? Math.Round((double)summary.TotalCanceled / summary.TotalOrders * 100, 2) : 0;


            // 7. Montagem do Objeto de Resposta Final
            var relatorioFinal = new RelatorioCompletoDto
            {
                Summary = summary,
                DailyData = dailyData,
                MonthlyData = monthlyData,
                StatusDistribution = statusDistribution,
                PedidosDetalhes = pedidosDetalhes 
            };

            return Ok(relatorioFinal);
        }

        //Mapeamento de Status para Labels e Cores(igual ao seu frontend)
        private static readonly Dictionary<OrderStatus, (string Label, string Color)> StatusMap = new()
        {
            { OrderStatus.NOVO, ("Recebido", "#3B82F6") },
            { OrderStatus.EM_PRODUCAO, ("Em Produção", "#F59E0B") },
            { OrderStatus.EM_ENTREGA, ("Em Entrega", "#8B5CF6") },
            { OrderStatus.COMPLETO, ("Completo", "#10B981") },
            { OrderStatus.CANCELADO, ("Cancelado", "#EF4444") }
        };

    }
}
