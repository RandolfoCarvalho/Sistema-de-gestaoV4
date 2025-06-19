using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.AspNetCore.SignalR;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Responses;
using SistemaDeGestao.Models.DTOs.Resquests;
using SistemaDeGestao.Services;
using SistemaDeGestao.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SistemaDeGestao.Controllers;
using System.Collections.Concurrent;
using SistemaDeGestao.Interfaces;
// Esta classe agora contém a lógica de negócio que estava no Controller.
public class PagamentoOrchestratorService : IPagamentoOrchestratorService
{
    private readonly DataBaseContext _context;
    private readonly IMercadoPagoService _mercadoPagoService;
    private readonly PedidoService _pedidoService;
    private readonly IHubContext<OrderHub> _hubContext;
    private readonly IEncryptionService _encryptionService;
    private readonly ILogger<PagamentoOrchestratorService> _logger;
    private readonly IDistributedCache _cache;
    private readonly IMercadoPagoApiClient _mercadoPagoApiClient;

    // Usaremos um semáforo local para travar o processamento de um mesmo ID de transação *dentro de uma única instância*.
    // O lock distribuído evitará que instâncias diferentes processem ao mesmo tempo.
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _transactionLocks = new ConcurrentDictionary<string, SemaphoreSlim>();

    public PagamentoOrchestratorService(
        DataBaseContext context,
        IMercadoPagoService mercadoPagoService,
        PedidoService pedidoService,
        IHubContext<OrderHub> hubContext,
        IEncryptionService encryptionService,
        ILogger<PagamentoOrchestratorService> logger,
        IDistributedCache cache,
        IMercadoPagoApiClient mercadoPagoApiClient)
    {
        _context = context;
        _mercadoPagoService = mercadoPagoService;
        _pedidoService = pedidoService;
        _hubContext = hubContext;
        _encryptionService = encryptionService;
        _logger = logger;
        _cache = cache;
        _mercadoPagoApiClient = mercadoPagoApiClient;
    }

    #region Métodos de Iniciação de Pagamento

    public async Task<PagamentoPixResponse> IniciarPagamentoPixAsync(PagamentoRequestPix request)
    {
        await ValidarDisponibilidadeProdutosAsync(request.PedidoDTO);

        var accessToken = await BuscaCredenciaisAsync(request.PedidoDTO.RestauranteId);

        _logger.LogInformation("Iniciando processamento de pagamento PIX para restaurante: {RestauranteId}", request.PedidoDTO.RestauranteId);
        var resultado = await _mercadoPagoService.ProcessarPixAsync(request.DadosPagamento, request.PedidoDTO, accessToken);
        _logger.LogInformation("Pagamento PIX iniciado com sucesso. TransactionId: {TransactionId}", resultado.TransactionId);

        return resultado;
    }

    public async Task<PaymentResponseDTO> IniciarPagamentoCartaoAsync(PagamentoRequest request)
    {
        await ValidarDisponibilidadeProdutosAsync(request.PedidoDTO);
        var accessToken = await BuscaCredenciaisAsync(request.PedidoDTO.RestauranteId);
        return await _mercadoPagoService.ProcessPayment(request.DadosPagamento, request.PedidoDTO, accessToken);
    }

    public async Task<PagamentoDinheiroResponseDTO> ProcessarPagamentoDinheiroAsync(PagamentoRequestDinheiro request)
    {
        var telefone = request.PedidoDTO.FinalUserTelefone;
        var rateLimitKey = $"ratelimit:pedido:{telefone}";
        var lockKey = $"lock:pedido:{telefone}";
        var lockValue = Guid.NewGuid().ToString();

        if (await _cache.GetStringAsync(rateLimitKey) != null)
        {
            _logger.LogWarning("Rate limit de 1 minuto ativo para o telefone {Telefone}", telefone);
            throw new InvalidOperationException("Você acabou de fazer um pedido. Aguarde 1 minuto para tentar novamente.");
        }

        // 2. Tenta adquirir um Lock de Concorrência para garantir que apenas uma requisição processe por vez.
        bool lockAcquired = false;
        try
        {
            if (await _cache.GetStringAsync(lockKey) == null)
            {
                await _cache.SetStringAsync(lockKey, lockValue, new DistributedCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30)
                });
                if (await _cache.GetStringAsync(lockKey) == lockValue)
                {
                    lockAcquired = true;
                }
            }

            if (!lockAcquired)
            {
                _logger.LogWarning("Tentativa de pedido concorrente para o telefone {Telefone}. Lock já em uso.", telefone);
                throw new InvalidOperationException("Seu pedido já está em processamento. Tente novamente em alguns segundos.");
            }

            // --- INÍCIO DA LÓGICA DE NEGÓCIO ---

            // 3. Processa a criação do pedido.
            request.PedidoDTO.Pagamento.TrocoPara = request.DadosPagamento.TrocoPara;
            var result = await _pedidoService.CriarPedidoAsync(request.PedidoDTO);

            // 4. Validação do resultado do pedido.
            if (result == null)
            {
                // FALHA: Se a criação do pedido falhou, não fazemos nada com o rate limit.
                // Apenas lançamos o erro. O lock de concorrência será liberado no `finally`.
                _logger.LogError("Falha ao criar pedido no serviço de pedidos para o telefone {Telefone}", telefone);
                throw new Exception("Falha ao criar pedido no serviço de pedidos.");
            }

            // SUCESSO! O pedido foi criado.
            // AGORA, e somente agora, aplicamos o rate limit de 1 minuto.
            await _cache.SetStringAsync(rateLimitKey, "true", new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1)
            });

            await _context.SaveChangesAsync();

            _logger.LogInformation("Pedido {NumeroPedido} criado e rate limit de 1 min aplicado para {Telefone}", request.PedidoDTO.Numero, telefone);

            // 5. Retorna a resposta de sucesso.
            return new PagamentoDinheiroResponseDTO
            {
                Timestamp = DateTime.UtcNow,
                NumeroPedido = request.PedidoDTO.Numero,
                Status = "approved",
                Message = "Pagamento registrado e pedido criado com sucesso."
            };
        }
        finally
        {
            if (lockAcquired && await _cache.GetStringAsync(lockKey) == lockValue)
            {
                await _cache.RemoveAsync(lockKey);
            }
        }
    }

    public async Task<object> ProcessarReembolsoAsync(ReembolsoRequest request)
    {
        var accessToken = await BuscaCredenciaisAsync(request.RestauranteId);
        return await _mercadoPagoService.ProcessarReembolso(request, accessToken);
    }

    #endregion

    #region Métodos de Verificação e Webhook

    public async Task ProcessarNotificacaoWebhookAsync(string transactionId)
    {
        var lockKey = $"lock:transaction:{transactionId}";
        var lockValue = await _cache.GetStringAsync(lockKey);
        if (lockValue != null)
        {
            _logger.LogInformation("Processamento para a transação {TransactionId} já está em andamento. Ignorando.", transactionId);
            return;
        }
        // Adquirindo o lock
        await _cache.SetStringAsync(lockKey, "locked", new DistributedCacheEntryOptions
        {
            AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(2)
        });
        try
        {
            await VerificarStatusEProcessarPedidoAsync(transactionId);
        }
        finally
        {
            // Libera o lock
            await _cache.RemoveAsync(lockKey);
        }
    }

    public async Task<object> ObterStatusPagamentoClienteAsync(long pagamentoId, int restauranteId)
    {
        string transactionId = pagamentoId.ToString();
        _logger.LogInformation("Verificando status do pagamento {TransactionId} para o restaurante {RestauranteId} a pedido do cliente.", transactionId, restauranteId);

        var pedidoExistente = await _context.Pedidos
            .AsNoTracking()
            .AnyAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId);

        if (pedidoExistente)
        {
            _logger.LogInformation("Pedido para a transação {TransactionId} já existe.", transactionId);
            return new { status = "approved", message = "Pedido já existe" };
        }

        var accessToken = await BuscaCredenciaisAsync(restauranteId);
        var statusPagamento = await _mercadoPagoApiClient.ObterStatusPagamentoAsync(transactionId, accessToken);

        if (statusPagamento == "approved")
        {
            await ProcessarPagamentoAprovadoAsync(transactionId, false);
            return new { status = "approved", message = "Pedido criado com sucesso" };
        }

        return new { status = statusPagamento };
    }

    // Este novo método centraliza a lógica de verificação e criação do pedido.
    private async Task VerificarStatusEProcessarPedidoAsync(string transactionId)
    {
        if (await _context.Pedidos.AsNoTracking().AnyAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId))
        {
            _logger.LogInformation("Pedido para transação {TransactionId} já foi processado. Ignorando.", transactionId);
            return;
        }

        var pedidoPendente = await TentarObterPedidoPendenteAsync(transactionId, 15, 200);

        if (pedidoPendente == null)
        {
            _logger.LogWarning("Webhook recebido, mas PedidoPendente com TransactionId {TransactionId} não foi encontrado.", transactionId);
            return;
        }

        var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
        if (pedidoDTO == null || pedidoDTO.RestauranteId <= 0)
        {
            _logger.LogError("Dados do pedido pendente são inválidos para TransactionId {TransactionId}", transactionId);
            _context.PedidosPendentes.Remove(pedidoPendente);
            await _context.SaveChangesAsync();
            return;
        }

        try
        {
            // 3. PASSO CRUCIAL: CONSULTA O STATUS REAL NA API DO MERCADO PAGO
            var accessToken = await BuscaCredenciaisAsync(pedidoDTO.RestauranteId);
            var statusPagamento = await _mercadoPagoApiClient.ObterStatusPagamentoAsync(transactionId, accessToken);

            _logger.LogInformation("Verificação de status via webhook para TransactionId {TransactionId}: Status obtido '{Status}'", transactionId, statusPagamento);

            // 4. DECISÃO: Cria o pedido SOMENTE SE o status for 'approved'
            if (statusPagamento == "approved")
            {
                _logger.LogInformation("Pagamento {TransactionId} está APROVADO. Criando pedido final.", transactionId);

                var result = await _pedidoService.CriarPedidoAsync(pedidoDTO);
                if (result == null) throw new Exception("Falha ao criar o pedido final a partir do pedido pendente.");

                // Apenas removemos o pendente se tudo deu certo
                _context.PedidosPendentes.Remove(pedidoPendente);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Pedido para a transação {TransactionId} foi criado com sucesso via webhook.", transactionId);
            }
            else
            {
                _logger.LogWarning("Pagamento {TransactionId} NÃO está aprovado (Status: {Status}). Nenhuma ação de criação de pedido será tomada.", transactionId, statusPagamento);

                //Limpar pedidos pendentes que nunca serão aprovados
                if (statusPagamento == "rejected" || statusPagamento == "cancelled")
                {
                    _context.PedidosPendentes.Remove(pedidoPendente);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("Pedido pendente para pagamento '{Status}' com TransactionId {TransactionId} foi removido.", statusPagamento, transactionId);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro crítico ao verificar status e processar notificação para TransactionId {TransactionId}", transactionId);
            throw;
        }
    }

    public async Task<object> VerificarStatusPagamentoPollingAsync(string transactionId)
    {
        var pedidoExistente = await _context.Pedidos.AsNoTracking()
            .AnyAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId);

        if (pedidoExistente)
        {
            return new { status = "approved", message = "Pedido já processado" };
        }

        var pedidoPendente = await _context.PedidosPendentes.AsNoTracking()
            .FirstOrDefaultAsync(p => p.TransactionId == transactionId);

        if (pedidoPendente == null)
        {
            return new { status = "not_found", message = "Pedido pendente não encontrado" };
        }

        var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
        var accessToken = await BuscaCredenciaisAsync(pedidoDTO.RestauranteId);
        var statusMercadoPago = await _mercadoPagoApiClient.ObterStatusPagamentoAsync(transactionId, accessToken);

        if (statusMercadoPago == "approved")
        {
            await ProcessarPagamentoAprovadoAsync(transactionId, false);
            return new { status = "approved", message = "Pagamento aprovado e pedido processado" };
        }

        return new { status = statusMercadoPago };
    }

    #endregion

    #region Métodos Privados Auxiliares

    private async Task ProcessarPagamentoAprovadoAsync(string transactionId, bool useRetryForPending)
    {
        var semaphore = _transactionLocks.GetOrAdd(transactionId, _ => new SemaphoreSlim(1, 1));
        await semaphore.WaitAsync();

        try
        {
            if (await _context.Pedidos.AsNoTracking().AnyAsync(p => p.Pagamento != null && p.Pagamento.TransactionId == transactionId))
            {
                _logger.LogInformation("Pedido para transação {TransactionId} já foi processado. Ignorando.", transactionId);
                return;
            }

            PedidoPendente pedidoPendente;
            if (useRetryForPending)
            {
                pedidoPendente = await TentarObterPedidoPendenteAsync(transactionId, 15, 200);
            }
            else
            {
                pedidoPendente = await _context.PedidosPendentes.FirstOrDefaultAsync(p => p.TransactionId == transactionId);
            }

            if (pedidoPendente == null)
            {
                _logger.LogWarning("Pedido pendente não encontrado para a transação {TransactionId} após tentativas.", transactionId);
                throw new InvalidOperationException($"Pedido pendente não encontrado para a transação {transactionId}.");
            }

            var pedidoDTO = JsonSerializer.Deserialize<PedidoDTO>(pedidoPendente.PedidoJson);
            pedidoDTO.Pagamento.TransactionId = transactionId;

            var result = await _pedidoService.CriarPedidoAsync(pedidoDTO);
            if (result == null) throw new Exception("Falha ao criar o pedido final a partir do pedido pendente.");
            _context.PedidosPendentes.Remove(pedidoPendente);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Pedido para a transação {TransactionId} foi criado com sucesso.", transactionId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro crítico ao processar pagamento aprovado para a transação {TransactionId}", transactionId);
            // Lançar a exceção permite que o controller a capture e retorne um status 500.
            throw;
        }
        finally
        {
            semaphore.Release();
            // Limpa o semáforo da memória após um tempo para não consumir recursos indefinidamente
            _ = Task.Delay(TimeSpan.FromMinutes(5)).ContinueWith(t => _transactionLocks.TryRemove(transactionId, out _));
        }
    }

    private async Task<string> BuscaCredenciaisAsync(int restauranteId)
    {
        if (restauranteId <= 0)
            throw new ArgumentException("ID do restaurante inválido.");

        var credencial = await _context.RestauranteCredenciaisMercadoPago
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.RestauranteId == restauranteId && c.Ativo);

        if (credencial == null)
            throw new InvalidOperationException("Credencial do Mercado Pago não encontrada ou inativa para o restaurante.");

        return _encryptionService.Decrypt(credencial.AccessToken);
    }

    private async Task ValidarDisponibilidadeProdutosAsync(PedidoDTO pedidoDto)
    {
        if (pedidoDto?.Itens == null || !pedidoDto.Itens.Any())
            throw new ArgumentException("O pedido deve conter pelo menos um item.");

        var produtoIds = pedidoDto.Itens.Select(i => i.ProdutoId).ToList();
        var produtosAtivos = await _context.Produtos
            .Where(p => produtoIds.Contains(p.Id) && p.Ativo)
            .Select(p => p.Id)
            .ToListAsync();

        var produtosInativosIds = produtoIds.Except(produtosAtivos).ToList();
        if (produtosInativosIds.Any())
            throw new InvalidOperationException($"Um ou mais produtos do pedido estão indisponíveis: IDs {string.Join(", ", produtosInativosIds)}");
    }

    private async Task<PedidoPendente> TentarObterPedidoPendenteAsync(string transactionId, int maxTentativas, int delayMs)
    {
        for (int i = 0; i < maxTentativas; i++)
        {
            var pedido = await _context.PedidosPendentes.AsNoTracking().FirstOrDefaultAsync(p => p.TransactionId == transactionId);
            if (pedido != null) return pedido;
            await Task.Delay(delayMs);
        }
        return null;
    }

    #endregion
}