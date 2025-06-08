using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Migrations;
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
        private readonly WhatsAppBotService _whatsappBot;

        public PedidoController(PedidoService pedidoService, ILogger<PedidoService> logger, DataBaseContext context, 
            IHubContext<OrderHub> hubContext, WhatsAppBotService whatsappBot)
        {
            _pedidoService = pedidoService;
            _logger = logger;
            _context = context;
            _hubContext = hubContext;
            _whatsappBot = whatsappBot;
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

        /// <summary>
        /// Endpoint para registrar o cancelamento de um pedido.
        /// </summary>
        [HttpPost("registrarCancelamento")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(typeof(object), 400)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> RegistrarCancelamento([FromBody] CancelamentoPedidoRequest request)
        {
            try
            {
                // O controlador apenas DELEGA a lógica para o serviço
                var (sucesso, mensagem) = await _pedidoService.RegistrarCancelamentoAsync(request);

                // E então, traduz o resultado do serviço em uma resposta HTTP
                if (sucesso)
                {
                    return Ok(new { Sucesso = true, Mensagem = mensagem });
                }

                // Se a mensagem indica que não foi encontrado, retorna 404
                if (mensagem.Contains("não encontrado"))
                {
                    return NotFound(new { Sucesso = false, Mensagem = mensagem });
                }

                // Para outros erros de negócio, retorna 400
                return BadRequest(new { Sucesso = false, Mensagem = mensagem });
            }
            catch (Exception ex)
            {
                // Captura exceções inesperadas que possam não ter sido tratadas no serviço
                _logger.LogError(ex, "Erro não tratado no endpoint de cancelamento de pedido.");
                return StatusCode(500, new { Sucesso = false, Mensagem = "Ocorreu um erro inesperado no servidor." });
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
