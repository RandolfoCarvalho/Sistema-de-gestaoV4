using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace SistemaDeGestao.Hubs
{
    public class PagamentoPixHub : Hub
    {
        public async Task JoinPaymentGroup(string transactionId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, transactionId);
        }
    }
}