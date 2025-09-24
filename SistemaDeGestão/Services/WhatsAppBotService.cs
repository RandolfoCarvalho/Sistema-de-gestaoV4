using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Migrations;
using SistemaDeGestao.Models;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace SistemaDeGestao.Services
{

    /// <summary>
    /// Serviço responsável por lidar com envio automatizado de mensagens via WhatsApp,
    /// utilizando a integração com o Venom Bot (executado localmente em Node.js).
    /// 
    /// Este serviço tem como objetivo principal facilitar a comunicação com o cliente final
    /// durante as etapas do pedido em um restaurante. Para isso, ele busca templates de mensagens
    /// cadastrados no banco de dados e preenche dinamicamente os campos com dados do pedido.
    /// </summary>
    public class WhatsAppBotService
    {
        private readonly HttpClient _httpClient;
        private readonly DataBaseContext _context;
        public WhatsAppBotService(HttpClient httpClient, DataBaseContext context)
        {
            _httpClient = httpClient;
            _context = context;
        }
        private static readonly Dictionary<string, string> StatusParaEtapaMensagem = new()
        {
            { "NOVO", "Pedido Recebido" },
            { "EM_PRODUCAO", "Em Produção" },
            { "EM_ENTREGA", "Saiu para Entrega" },
            { "COMPLETO", "Entregue" },
            { "CANCELADO", "Cancelado" }
        };

        public async Task<List<ModeloMensagem>> ListarMensagensAsync(int restauranteId)
        {
            return await _context.ModelosMensagem
                .Where(m => m.RestauranteId == restauranteId)
                .ToListAsync();
        }

        public async Task<bool> MontarMensagemAsync(Pedido pedido)
        {
            if (!pedido.AcompanhamentoAtivo ?? false)
                return false;

            // Mapear status para etapa
            if (!StatusParaEtapaMensagem.TryGetValue(pedido.Status.ToString(), out var etapa))
            {
                return false;
            }
            // Buscar o modelo de mensagem da etapa correspondente
            var modeloMensagem = await _context.ModelosMensagem
                .FirstOrDefaultAsync(m => m.RestauranteId == pedido.RestauranteId && m.Etapa == etapa);
            
            if (modeloMensagem != null)
            {
                if (modeloMensagem.Etapa == "Pedido Recebido") return false;
                var clienteNome = pedido.FinalUserName ?? "Cliente";
                var numeroDoPedido = pedido.Numero;
                var valor = pedido.Itens.Sum(i => i.PrecoUnitario * i.Quantidade).ToString("C");
                var data = DateTime.Now.ToString("dd/MM/yyyy");
                var status = pedido.Status.ToString();

                // Substituir variáveis no template
                var mensagem = modeloMensagem.Texto
                    .Replace("{{cliente}}", clienteNome)
                    .Replace("{{status}}", status)
                    .Replace("{{pedido}}", numeroDoPedido)
                    .Replace("{{valor}}", valor)
                    .Replace("{{data}}", data);

                // Enviar via Venom Bot
                await EnviarMensagemAsync(pedido.NomeDaLoja, pedido.FinalUserTelefone + "@c.us", mensagem);
                return true;
            }
            return false;
        }

        //var response = await httpClient.PostAsync("https://bot.fomedique.com.br/send-message", content);
        //var response = await httpClient.PostAsync("http://localhost:3001/send-message", content);
        public async Task<bool> EnviarMensagemAsync(string session, string telefone, string mensagem)
        {
            var telefoneFormatado = FormatarParaWhatsAppId(telefone);
            using var httpClient = new HttpClient();
            var jsonBody = new
            {
                session,
                phone = telefoneFormatado,
                message = mensagem
            };
            var content = new StringContent(JsonSerializer.Serialize(jsonBody), Encoding.UTF8, "application/json");
            var response = await httpClient.PostAsync("https://bot.fomedique.com.br/send-message", content);
            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"Erro ao enviar mensagem para {telefoneFormatado}: {errorContent}");
            }
            return response.IsSuccessStatusCode;
        }

        private string FormatarParaWhatsAppId(string numeroLocal)
        {
            var apenasDigitos = new string(numeroLocal.Where(char.IsDigit).ToArray());
            if (apenasDigitos.Length == 11 && apenasDigitos[2] == '9')
            {
                var ddd = apenasDigitos.Substring(0, 2);
                var numeroSemNove = apenasDigitos.Substring(3);
                apenasDigitos = ddd + numeroSemNove; // Ex: "64992926006" -> "6492926006"
            }
            if (!apenasDigitos.StartsWith("55"))
            {
                apenasDigitos = "55" + apenasDigitos;
            }
            if (!apenasDigitos.EndsWith("@c.us"))
            {
                apenasDigitos += "@c.us";
            }

            return apenasDigitos;
        }
    }

}
