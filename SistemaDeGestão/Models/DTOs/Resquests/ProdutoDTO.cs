using SistemaDeGestão.Models;
using SistemaDeGestão.Models.DTOs.Resquests;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

public class ProdutoDTO
{
    public int Id { get; set; }
    public string Nome { get; set; }

    public string? Descricao { get; set; }

    public int CategoriaId { get; set; }

    public decimal PrecoCusto { get; set; }
    public bool Ativo { get; set; }

    public decimal PrecoVenda { get; set; }

    public int EstoqueAtual { get; set; }

    public int EstoqueMinimo { get; set; }

    public string? UnidadeMedida { get; set; }

    public IFormFile? ImagemPrincipalUrl { get; set; }

    public List<ComplementoDTO>? Complementos { get; set; } = new List<ComplementoDTO>();
    public List<int> GruposComplementosIds { get; set; } = new List<int>();
    public List<int> GrupoAdicionalIds { get; set; } = new List<int>();


    public List<int>? AdicionaisIds { get; set; } = new List<int>();
}