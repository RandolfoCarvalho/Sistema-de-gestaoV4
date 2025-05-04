using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Services;
using SistemaDeGestao.Services.Interfaces;

namespace SistemaDeGestao.Areas.Admin.Controllers
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

        [HttpGet("UserExists/{telefone}")]
        public async Task<IActionResult> UserExists(string telefone)
        {
            var user = await _context.FinalUsers.FirstOrDefaultAsync(u => u.Telefone == telefone);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpGet("getUserInfoById/{id}")]
        public async Task<IActionResult> GetUserInfoById(int id)
        {
            var user = await _context.FinalUsers.FindAsync(id);
            if (user == null) return NotFound();
            return Ok(new
            {
                user.Nome,
                user.Telefone
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
