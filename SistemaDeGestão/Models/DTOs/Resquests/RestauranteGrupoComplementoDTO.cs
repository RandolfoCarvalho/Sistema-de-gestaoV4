using SistemaDeGestao.Models;

public class RestauranteGrupoComplementoDto
{
    public Restaurante Restaurante { get; set; }
    public IEnumerable<GrupoComplemento> GruposComplementos { get; set; }
}
