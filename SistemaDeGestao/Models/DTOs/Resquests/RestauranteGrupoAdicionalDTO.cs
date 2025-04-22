using SistemaDeGestao.Models;

public class RestauranteGrupoAdicionalDto
{
    public Restaurante Restaurante { get; set; }
    public IEnumerable<GrupoAdicional> GruposComplementos { get; set; }
}
