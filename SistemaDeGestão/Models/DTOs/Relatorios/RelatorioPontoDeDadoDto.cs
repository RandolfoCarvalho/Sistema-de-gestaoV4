namespace SistemaDeGestao.Models.DTOs.Relatorios
{
    // Em uma pasta como 'DTOs/Relatorios'

    // Representa um único ponto no tempo para os gráficos (um dia, um mês, etc.)
    public class RelatorioPontoDeDadoDto
    {
        public string Name { get; set; } // O label (ex: "seg, 22", "jul, 24")
        public int Orders { get; set; }
        public decimal Revenue { get; set; }
        public decimal Costs { get; set; }
        public decimal Profit { get; set; }
        public int Canceled { get; set; }
    }

    // Representa os cards de resumo e os insights
    public class RelatorioSumarioDto
    {
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal TotalCosts { get; set; }
        public decimal TotalProfit { get; set; }
        public int TotalCanceled { get; set; }
        public decimal AverageOrderValue { get; set; } // Valor Médio do Pedido
        public double ProfitMargin { get; set; }       // Margem de Lucro (%)
        public double CancellationRate { get; set; }   // Taxa de Cancelamento (%)
    }

    // Representa a distribuição de status para o gráfico de pizza
    public class RelatorioStatusDto
    {
        public string Name { get; set; }  // Label: "Completo", "Cancelado"
        public int Value { get; set; }    // Quantidade
        public string Color { get; set; } // Cor para o gráfico (ex: "#10B981")
    }


    // A classe principal que agrupa tudo e será enviada como resposta JSON
    public class RelatorioCompletoDto
    {
        public RelatorioSumarioDto Summary { get; set; }
        public List<RelatorioPontoDeDadoDto> DailyData { get; set; }
        public List<RelatorioPontoDeDadoDto> MonthlyData { get; set; }
        public List<RelatorioStatusDto> StatusDistribution { get; set; }

        // NOVA PROPRIEDADE PARA O PDF DETALHADO
        public List<PedidoSimplificadoDto> PedidosDetalhes { get; set; }
    }
    public class PedidoSimplificadoDto
    {
        public string Numero { get; set; }
        public DateTime DataPedido { get; set; }
        public string NomeCliente { get; set; }
        public string Status { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal TaxaEntrega { get; set; } // Novo campo
    }
}
