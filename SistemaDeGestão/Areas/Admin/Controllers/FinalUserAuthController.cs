using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Resquests; // Crie este DTO
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

        /// <summary>
        /// Tenta autenticar um usuário existente apenas pelo telefone.
        /// </summary>
        /// <returns>Dados do usuário e um token JWT se encontrado.</returns>
        [HttpPost("login")]
        [ProducesResponseType(typeof(object), 200)]
        [ProducesResponseType(404)]
        public async Task<IActionResult> Login([FromBody] FinalUserLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Telefone))
                return BadRequest("O telefone é obrigatório.");

            var finalUser = await _clienteService.BuscarPorTelefone(request.Telefone);
            if (finalUser == null)
            {
                return NotFound(new { message = "Usuário não encontrado. Por favor, complete o cadastro." });
            }

            var token = GerarTokenJwt(finalUser);

            return Ok(new
            {
                finalUser.Id,
                finalUser.Nome,
                finalUser.Telefone,
                Token = token
            });
        }

        /// <summary>
        /// Registra um novo usuário.
        /// </summary>
        /// <returns>Os dados do novo usuário e um token JWT.</returns>
        [HttpPost("register")]
        [ProducesResponseType(typeof(object), 201)]
        [ProducesResponseType(400)]
        [ProducesResponseType(409)] // Conflict
        public async Task<IActionResult> Register([FromBody] FinalUserRegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var usuarioExistente = await _clienteService.BuscarPorTelefone(request.Telefone);
            if (usuarioExistente != null)
            {
                // Retorna 409 Conflict se o telefone já estiver em uso.
                return Conflict(new { message = "Este número de telefone já está cadastrado." });
            }

            var novoUsuario = new FinalUser
            {
                Nome = request.Nome,
                Telefone = request.Telefone
            };

            var finalUser = await _clienteService.CriarCliente(novoUsuario);
            var token = GerarTokenJwt(finalUser);

            // Retorna 201 Created com os dados do usuário.
            return CreatedAtAction(nameof(Login), new { telefone = finalUser.Telefone }, new
            {
                finalUser.Id,
                finalUser.Nome,
                finalUser.Telefone,
                Token = token
            });
        }

        /// <summary>
        /// Gera um token JWT real e seguro.
        /// </summary>
        private string GerarTokenJwt(FinalUser user)
        {
            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim("name", user.Nome),
                new Claim("phone_number", user.Telefone),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(8), 
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class FinalUserLoginRequest
    {
        public string Telefone { get; set; }
    }

    public class FinalUserRegisterRequest
    {
        [System.ComponentModel.DataAnnotations.Required]
        public string Nome { get; set; }
        [System.ComponentModel.DataAnnotations.Required]
        public string Telefone { get; set; }
    }
}