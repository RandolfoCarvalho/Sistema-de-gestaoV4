using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestão.Data;
using SistemaDeGestão.Services;
using SistemaDeGestão.Services.Interfaces;

namespace SistemaDeGestão.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/1.0/[controller]")]
    public class FinalUserController : Controller
    {
        private readonly DataBaseContext _context;
        private readonly FinalUserService _finalUserService;
        public FinalUserController(DataBaseContext context, FinalUserService finalUserService)
        {
            _context = context;
            _finalUserService = finalUserService;
        }

        [HttpGet("getUserInfoById/{id}")]
        public async Task<IActionResult> GetUserInfoById(int id)
        {
            var user = await _context.FinalUsers.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(new
            {
                Nome = user.Nome,
                Telefone = user.Telefone
            });
        }
        [HttpGet("GetPedidosByUser/{numeroTelefone}/{restauranteId}")]
        public async Task<IActionResult> GetPedidosByUser(string numeroTelefone, int restauranteId)
        {
            var pedido = await _finalUserService.GetPedidosByUser(numeroTelefone, restauranteId);
            if (pedido == null) return NotFound();
            return Ok(pedido);
        }
    }
 }
