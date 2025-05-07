using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SistemaDeGestao.Models;
using SistemaDeGestao.Services;
using SistemaDeGestao.Services.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace SistemaDeGestao.Areas.Admin.Controllers
{
    [ApiController]
    [Route("api/1.0/[controller]")]
    public class FinalUserAuthController : ControllerBase
    {
        private readonly IFinalUserService _clienteService;
        private readonly IConfiguration _configuration;

        public FinalUserAuthController(IFinalUserService clienteService, IConfiguration configuration)
        {
            _clienteService = clienteService;
            _configuration = configuration;
        }

        [HttpPost("VerificarTelefone")]
        public async Task<IActionResult> VerificarTelefone([FromBody] FinalUser user)
        {
            var finalUser = await _clienteService.BuscarPorTelefone(user.Telefone);
            if (finalUser == null)
            {
                finalUser = await _clienteService.CriarCliente(user);
            }
            var token = GerarTokenCliente(user.Telefone);

            Response.Cookies.Append("AuthToken", token, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.Strict
            });

            return Ok(finalUser);
        }
        private string GerarTokenCliente(string telefone)
        {
            return $"FakeToken-{telefone}-{Guid.NewGuid()}";
        }
    }
}
