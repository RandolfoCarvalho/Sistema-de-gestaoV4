using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Services;
using System.Text.Json;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [Route("api/1.0/[controller]")]
    public class PedidoController : Controller
    {
        private readonly PedidoService _pedidoService;
        private readonly ILogger<PedidoService> _logger;
        private readonly DataBaseContext _context;
        private readonly IHubContext<OrderHub> _hubContext;
        

        public PedidoController(PedidoService pedidoService, ILogger<PedidoService> logger, DataBaseContext context, 
            IHubContext<OrderHub> hubContext)
        {
            _pedidoService = pedidoService;
            _logger = logger;
            _context = context;
            _hubContext = hubContext;
        }
        [HttpGet("ListarPedidos/{status?}")]
        public async Task<ActionResult<IEnumerable<Pedido>>> ListarPedidos()
        {
            var pedidos = await _pedidoService.ListarPedidosAsync();
            return Ok(pedidos);
        }
        [HttpGet]
        [Route("ObterPedido/{id}")]
        public async Task<IActionResult> ObterPedido(int id)
        {
            var pedido = await _pedidoService.ObterPedido(id);
            if (pedido == null) return NotFound("Pedido não encontrado");
            return Ok(pedido);
        }
        [HttpGet]
        [Route("ObterPedidoPorIdeRestauranteId/{id}/{restauranteId}")]
        public async Task<IActionResult> ObterPedidoPorIdeRestauranteId(int id, int restauranteId)
        {
            var pedido = await _pedidoService.ObterPedidoPorIdeRestauranteId(id, restauranteId);
            if (pedido == null) return NotFound("Pedido não encontrado");
            return Ok(pedido);
        }
        [HttpPut("AtualizarStatusPedido/{id}/{novoStatus}")]
        public async Task<IActionResult> AtualizarStatusPedido(int id, OrderStatus novoStatus)
        {
            try
            {
                var pedido = await _pedidoService.AtualizarStatusPedidoAsync(id, novoStatus);
                if (pedido == null)
                    return NotFound(new { message = "Pedido não encontrado" });
                return Ok(pedido);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpPost]
        [Route("CriarPedido")]
        public async Task<ActionResult<Pedido>> CriarPedido([FromBody] PedidoDTO pedido)
        {
            try
            {
                if (pedido == null) return null;
                var pedidoNovo = await _pedidoService.CriarPedidoAsync(pedido);
                return Ok(pedidoNovo);
            }
            catch (Exception ex)
            {
                var bad = ex.InnerException?.Message ?? ex.Message;
                return BadRequest(bad);
            }
        }

        [HttpPost("registrarCancelamento")]
        public async Task<IActionResult> RegistrarCancelamento([FromBody] CancelamentoPedidoRequest request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Busca o pedido com todos os relacionamentos necessários
                var pedido = await _context.Pedidos
                    .Include(p => p.Itens)
                    .FirstOrDefaultAsync(p => p.Id == request.PedidoId);

                if (pedido == null)
                    return NotFound("Pedido não encontrado");
                // Atualiza o status do pedido para cancelado em vez de excluí-lo
                pedido.Status = OrderStatus.CANCELADO;
                // Cria o registro de pedido cancelado
                var pedidoCancelado = new PedidoCancelado
                {
                    PedidoId = request.PedidoId,
                    MotivoCancelamento = request.MotivoCancelamento,
                    CodigoReembolso = request.CodigoReembolso,
                    ValorReembolsado = request.ValorReembolsado,
                    TransacaoReembolsoId = request.TransacaoReembolsoId,
                    EstaReembolsado = request.EstaReembolsado,
                    FinalUserId = request.FinalUserId,
                    DataCancelamento = DateTime.Now
                };
                _context.PedidosCancelados.Add(pedidoCancelado);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { Sucesso = true, Mensagem = "Pedido cancelado com sucesso" });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return BadRequest(new { Sucesso = false, Mensagem = "Erro ao cancelar pedido", Erro = ex.Message });
            }
        }

        /*[HttpPost]
        [Route("AdicionarItemAoPedido")]
        public async Task<IActionResult> AdicionarItemAoPedido([FromBody] ItemPedido item)
        {
            var resultado = await _pedidoService.AdicionarItemAoPedido(item);
            if (resultado == null) return BadRequest("Erro ao adicionar item ao pedido");
            return Ok(resultado);
        }

        [HttpPut]
        [Route("AtualizarOpcoesDoItem/{itemId}")]
        public async Task<IActionResult> AtualizarOpcoesDoItem(int itemId, [FromBody] Dictionary<string, List<OpcoesItemPedido>> opcoes)
        {
            var resultado = await _pedidoService.AtualizarOpcoesDoItem(itemId, opcoes);
            if (resultado == null) return BadRequest("Erro ao atualizar opções do item");
            return Ok(resultado);
        }

        [HttpDelete]
        [Route("RemoverItemDoPedido/{pedidoId}/{itemId}")]
        public async Task<IActionResult> RemoverItemDoPedido(int pedidoId, int itemId)
        {
            var resultado = await _pedidoService.RemoverItemDoPedido(pedidoId, itemId);
            if (!resultado) return BadRequest("Erro ao remover item do pedido");
            return NoContent();
        }*/

        //Item pedido

        [HttpGet]
        [Route("ListarItensPedido/{pedidoId}")]
        public async Task<IActionResult> ListarItensPedido(int pedidoId)
        {
            return Ok(await _pedidoService.ListarItensPedido(pedidoId));
        }

        [HttpGet]
        [Route("ObterItemPedido/{id}")]
        public async Task<IActionResult> ObterItemPedido(int id)
        {
            var item = await _pedidoService.ObterItemPedido(id);
            if (item == null) return NotFound("Item não encontrado");
            return Ok(item);
        }

        /*[HttpGet]
        [Route("ObterOpcoesDoItem/{id}")]
        public async Task<IActionResult> ObterOpcoesDoItem(int id)
        {
            var opcoes = await _pedidoService.ObterOpcoesDoItem(id);
            if (opcoes == null) return NotFound("Item não encontrado");
            return Ok(opcoes);
        }*/

        /*[HttpPost]
        [Route("CriarItemPedido")]
        public async Task<IActionResult> CriarItemPedido([FromBody] ItemPedidoDTO itemDTO)
        {
            try
            {
                _logger.LogInformation("Recebendo request para criar item pedido: {@Item}", itemDTO);

                if (!ModelState.IsValid)
                {
                    var erros = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    _logger.LogWarning("Erros de validação encontrados: {@Erros}", erros);
                    return BadRequest(new
                    {
                        Message = "Dados inválidos para criar item do pedido",
                        Errors = erros
                    });
                }

                // Criar o ItemPedido a partir do DTO
                var item = new ItemPedido
                {
                    ProdutoId = itemDTO.ProdutoId,
                    Quantidade = itemDTO.Quantidade,
                    PrecoUnitario = itemDTO.PrecoUnitario,
                    SubTotal = itemDTO.SubTotal,
                    Observacoes = itemDTO.Observacoes
                };

                // Resto do código permanece igual...
                var resultado = await _pedidoService.CriarItemPedido(item);
                return Ok(new
                {
                    Message = "Item do pedido criado com sucesso",
                    Data = resultado
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao criar item do pedido");
                return StatusCode(500, new
                {
                    Message = "Erro ao processar a requisição",
                    Error = ex.Message
                });
            }
        }*/
        [HttpPut]
        [Route("AtualizarObservacoes/{id}")]
        public async Task<IActionResult> AtualizarObservacoes(int id, [FromBody] ItemPedidoDTO itemPedidoDTO)
        {
            if (itemPedidoDTO == null || string.IsNullOrEmpty(itemPedidoDTO.Observacoes))
            {
                return BadRequest("Observações não podem ser nulas ou vazias");
            }

            var resultado = await _pedidoService.AtualizarObservacoes(id, itemPedidoDTO.Observacoes);
            if (resultado == null) return BadRequest("Erro ao atualizar observações");
            return Ok(resultado);
        }
        /*[HttpPut]
        [Route("AtualizarOpcoesExtras/{id}")]
        public async Task<IActionResult> AtualizarOpcoesExtras(int id, [FromBody] Dictionary<string, List<OpcoesItemPedido>> opcoes)
        {
            var resultado = await _pedidoService.AtualizarOpcoesExtras(id, opcoes);
            if (resultado == null) return BadRequest("Erro ao atualizar opções extras");
            return Ok(resultado);
        }

        [HttpDelete]
        [Route("RemoverItemPedido/{id}")]
        public async Task<IActionResult> RemoverItemPedido(int id)
        {
            var resultado = await _pedidoService.RemoverItemPedido(id);
            if (!resultado) return BadRequest("Erro ao remover item");
            return NoContent();
        }*/
        [HttpDelete]
        [Route("DeleteAll")]
        public async Task<IActionResult> DeleteAll()
        {
            await _pedidoService.DeleteAll();
            return Ok();
        }
    }
}
