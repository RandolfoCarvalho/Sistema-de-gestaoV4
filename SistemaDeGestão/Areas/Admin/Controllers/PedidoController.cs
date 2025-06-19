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
    [ApiController] 
    public class PedidoController : ControllerBase
    {
        private readonly PedidoService _pedidoService;
        private readonly ILogger<PedidoController> _logger;
        private readonly DataBaseContext _context;

        public PedidoController(PedidoService pedidoService, ILogger<PedidoController> logger, DataBaseContext context)
        {
            _pedidoService = pedidoService;
            _logger = logger;
            _context = context;
        }

        [HttpGet("ListarPedidos")]
        public async Task<ActionResult<IEnumerable<Pedido>>> ListarPedidos()
        {
            var pedidos = await _pedidoService.ListarPedidosAsync();
            return Ok(pedidos);
        }

        [HttpGet("ObterPedido/{id}")]
        [ProducesResponseType(typeof(Pedido), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> ObterPedido(int id)
        {
            try
            {
                var pedido = await _pedidoService.ObterPedido(id);
                return Ok(pedido);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }

        [HttpGet("ObterPedidoPorIdeRestauranteId/{id}/{restauranteId}")]
        public async Task<IActionResult> ObterPedidoPorIdeRestauranteId(int id, int restauranteId)
        {
            var pedido = await _pedidoService.ObterPedidoPorIdeRestauranteId(id, restauranteId);
            if (pedido == null) return NotFound("Pedido não encontrado para este restaurante.");
            return Ok(pedido);
        }

        [HttpPut("AtualizarStatusPedido/{id}/{novoStatus}")]
        public async Task<IActionResult> AtualizarStatusPedido(int id, OrderStatus novoStatus)
        {
            try
            {
                var pedido = await _pedidoService.AtualizarStatusPedidoAsync(id, novoStatus);
                if (pedido == null)
                    return NotFound(new { message = "Pedido não encontrado." });
                return Ok(pedido);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao atualizar status do pedido {PedidoId}", id);
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("CriarPedido")]
        [ProducesResponseType(typeof(Pedido), 201)]
        [ProducesResponseType(typeof(string), 400)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<IActionResult> CriarPedido([FromBody] PedidoDTO pedidoDto)
        {
            try
            {
                var pedidoNovo = await _pedidoService.CriarPedidoAsync(pedidoDto);
                return CreatedAtAction(nameof(ObterPedido), new { id = pedidoNovo.Id }, pedidoNovo);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Argumento inválido ao criar pedido.");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Operação inválida ao criar pedido (ex: estoque, loja fechada).");
                return BadRequest(new { success = false, message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro inesperado ao criar pedido.");
                return StatusCode(500, new { success = false, message = "Ocorreu um erro inesperado. Tente novamente." });
            }
        }

        [HttpPost("verificar-estoque-pedido")]
        public async Task<IActionResult> VerificarEstoquePedido([FromBody] PedidoDTO pedidoDTO)
        {
            if (pedidoDTO == null || !pedidoDTO.Itens.Any())
                return BadRequest("Pedido inválido.");

            var produtoIds = pedidoDTO.Itens.Select(i => i.ProdutoId).ToList();
            var produtos = await _context.Produtos
                .Where(p => produtoIds.Contains(p.Id))
                .ToListAsync();

            foreach (var item in pedidoDTO.Itens)
            {
                var produto = produtos.FirstOrDefault(p => p.Id == item.ProdutoId);
                if (produto == null || !produto.Ativo)
                    return BadRequest($"Produto {item.NomeProduto ?? item.ProdutoId.ToString()} está indisponível.");

                if (produto.EstoqueAtual < item.Quantidade)
                    return BadRequest($"Produto '{produto.Nome}' sem estoque suficiente.");
            }

            return Ok("Estoque e produtos válidos.");
        }

        [HttpPost("registrarCancelamento")]
        public async Task<IActionResult> RegistrarCancelamento([FromBody] CancelamentoPedidoRequest request)
        {
            var (sucesso, mensagem) = await _pedidoService.RegistrarCancelamentoAsync(request);
            if (sucesso)
            {
                return Ok(new { Sucesso = true, Mensagem = mensagem });
            }
            return BadRequest(new { Sucesso = false, Mensagem = mensagem });
        }

        [HttpGet("ListarItensPedido/{pedidoId}")]
        public async Task<IActionResult> ListarItensPedido(int pedidoId)
        {
            var itens = await _pedidoService.ListarItensPedido(pedidoId);
            return Ok(itens);
        }

        [HttpPut("AtualizarObservacoes/{id}")]
        public async Task<IActionResult> AtualizarObservacoes(int id, [FromBody] ItemPedidoDTO itemPedidoDTO)
        {
            if (itemPedidoDTO == null) return BadRequest("Dados inválidos.");
            var resultado = await _pedidoService.AtualizarObservacoes(id, itemPedidoDTO.Observacoes);
            if (resultado == null) return NotFound("Item não encontrado para atualizar observações.");
            return Ok(resultado);
        }

        [HttpDelete("DeleteAll")]
        [ProducesResponseType(200)]
        public async Task<IActionResult> DeleteAll()
        {
            // ATENÇÃO: Endpoint perigoso para produção.
            await _pedidoService.DeleteAll();
            return Ok(new { message = "Todos os pedidos foram deletados." });
        }
    }
}