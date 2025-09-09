using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs.Resquests;

namespace SistemaDeGestao.Services
{
    public class ComplementoService : Controller
    {
        private readonly DataBaseContext _context;

        public ComplementoService(DataBaseContext context)
        {
            _context = context;
        }
        public async Task<List<ComplementoDTO>> ObterComplementosPorProdutoId(int produtoId)
        {
            var complementos = await _context.ProdutoComplementos
                .Include(pc => pc.Complemento)
                .Where(pc => pc.ProdutoId == produtoId)
                .Select(pc => new ComplementoDTO
                {
                    Id = pc.ComplementoId,
                    Nome = pc.Complemento.Nome,
                    MaximoPorProduto = pc.MaximoPorProduto,
                    Descricao = pc.Complemento.Descricao,
                    Preco = pc.Complemento.Preco,
                    Ativo = pc.Complemento.Ativo
                })
                .ToListAsync();

            return complementos;
        }
        public async Task<ComplementoDTO> AtualizarComplemento(Complemento complemento)
        {
            if (complemento == null) return null;

            var complementoExistente = await _context.Complementos.FindAsync(complemento.Id);
            if (complementoExistente == null) return null;

            _context.Entry(complementoExistente).CurrentValues.SetValues(complemento);
            await _context.SaveChangesAsync();

            return new ComplementoDTO
            {
                Id = complementoExistente.Id,
                Nome = complementoExistente.Nome,
                Descricao = complementoExistente.Descricao,
                Preco = complementoExistente.Preco,
                Ativo = complementoExistente.Ativo,
                MaximoPorProduto = complementoExistente.MaximoPorProduto,
                GrupoComplementoId = complementoExistente.GrupoComplementoId
            };
        }
        // Deletar Grupo complemento sem delete em cascata
        public async Task DeletarComplemento(int id)
        {
            var complemento = await _context.Complementos.FindAsync(id);
            if (complemento == null) return;
            _context.Remove(complemento);
            await _context.SaveChangesAsync();
        }

        //-------------------------------------------------------------------------------//

        // Grupos adicionais
        public async Task<IEnumerable<GrupoComplemento>> ListarGrupoComplementos(int restauranteId)
        {
            var grupoComplementos = await _context.GrupoComplementos
                .Include(gc => gc.Complementos)
                .Where(ga => ga.RestauranteId == restauranteId)
                .ToListAsync();
            return grupoComplementos;
        }

        public async Task<GrupoComplemento> ListarGrupoComplementoPorId(int id)
        {
            return await _context.GrupoComplementos
                .Include(g => g.Complementos)
                .Where(g => g.Id == id)
                .FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<GrupoComplemento>> ListarGrupoComplementosAtivosEInativos(int restauranteId)
        {
            var grupoComplementos = await _context.GrupoComplementos
            .Include(ga => ga.Complementos) 
            .Where(ga => ga.RestauranteId == restauranteId) 
            .ToListAsync();  

            return grupoComplementos;
        }

        public async Task<GrupoComplemento> CriarGrupoComplemento(GrupoComplemento grupoComplemento)
        {
            _context.GrupoComplementos.Add(grupoComplemento);
            await _context.SaveChangesAsync();
            return grupoComplemento;
        }

        public async Task<IEnumerable<GrupoComplemento>> ListarGrupoComplementosPorProduto(int produtoId, int restauranteId)
        {
            var gruposComplementos = await _context.GrupoComplementos
                .Where(g => g.Ativo && g.Complementos.Any(a => a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Include(g => g.Complementos.Where(a => a.Ativo && a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Where(ga => ga.RestauranteId == restauranteId)
                .OrderBy(g => g.Nome)
                .ToListAsync();

            return gruposComplementos;
        }

        public async Task<RestauranteGrupoComplementoDto> ObterGrupoComplementoPorNome(string nomeDaLoja, int produtoId)
        {
            var restaurante = await _context.Restaurantes
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.NomeDaLoja.ToLower() == nomeDaLoja.ToLower());

            if (restaurante == null)
            {
                return null; // Retorna null caso o restaurante não seja encontrado
            }

            var gruposComplementos = await _context.GrupoComplementos
                .Where(g => g.Ativo && g.Complementos.Any(a => a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Include(g => g.Complementos.Where(a => a.Ativo && a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Where(g => g.RestauranteId == restaurante.Id)
                .OrderBy(g => g.Nome)
                .ToListAsync();

            return new RestauranteGrupoComplementoDto
            {
                Restaurante = restaurante,
                GruposComplementos = gruposComplementos
            };
        }


        public async Task<IActionResult> AdicionarComplementoAoGrupo(int complementoId, int grupoComplementoId)
        {
            var complemento = await _context.Complementos
                .FirstOrDefaultAsync(c => c.Id == complementoId);
            if (complemento == null) return NotFound("Complemento não encontrado. ID " + complementoId);

            var grupoComplemento = await _context.GrupoComplementos
                .FirstOrDefaultAsync(g => g.Id == grupoComplementoId);
            if (grupoComplemento == null) return NotFound("Grupo de complementos não encontrado.");

            complemento.GrupoComplementoId = grupoComplementoId;
            try
            {
                _context.Complementos.Update(complemento);
                await _context.SaveChangesAsync();
                return Ok("Complemento adicionado ao grupo com sucesso.");
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao adicionar complemento ao grupo: {ex.Message}");
            }
        }

        public async Task<GrupoComplemento> AtualizarGrupoComplemento(GrupoComplemento grupoComplemento)
        {
            var grupoExistente = await _context.GrupoComplementos
                .Include(g => g.Complementos)
                .FirstOrDefaultAsync(g => g.Id == grupoComplemento.Id);

            if (grupoExistente == null) return null;

            grupoExistente.Nome = grupoComplemento.Nome;
            grupoExistente.Ativo = grupoComplemento.Ativo;
            grupoExistente.QuantidadeMaxima = grupoComplemento.QuantidadeMaxima;
            grupoExistente.QuantidadeMinima = grupoComplemento.QuantidadeMinima;
            grupoExistente.Obrigatorio = grupoComplemento.Obrigatorio;
            grupoExistente.Descricao = grupoComplemento.Descricao;
            grupoExistente.MultiplaEscolha = grupoComplemento.MultiplaEscolha;

            var complementosRemovidos = grupoExistente.Complementos
                .Where(c => !grupoComplemento.Complementos.Any(nc => nc.Id == c.Id))
                .ToList();

            foreach (var complementoRemovido in complementosRemovidos)
            {
                _context.Complementos.Remove(complementoRemovido);
            }
            foreach (var complemento in grupoComplemento.Complementos)
            {
                var complementoExistente = grupoExistente.Complementos
                    .FirstOrDefault(c => c.Id == complemento.Id);

                if (complementoExistente != null)
                {
                    complementoExistente.Nome = complemento.Nome;
                    complementoExistente.Descricao = complemento.Descricao;
                    complementoExistente.Preco = complemento.Preco;
                    complementoExistente.Ativo = complemento.Ativo;
                    complementoExistente.MaximoPorProduto = complemento.MaximoPorProduto;
                }
                else
                {
                    grupoExistente.Complementos.Add(complemento);
                }
            }
            await _context.SaveChangesAsync();
            var produtosAssociados = await _context.Produtos
                .Include(p => p.Complementos)
                .Where(p => p.Complementos.Any(pc => grupoExistente.Complementos.Select(gc => gc.Id).Contains(pc.ComplementoId)))
                .ToListAsync();

            foreach (var produto in produtosAssociados)
            {
                foreach (var complemento in grupoExistente.Complementos)
                {
                    var existeProdutoComplemento = produto.Complementos.Any(pc => pc.ComplementoId == complemento.Id);

                    if (!existeProdutoComplemento)
                    {
                        var novoProdutoComplemento = new ProdutoComplemento
                        {
                            ProdutoId = produto.Id,
                            ComplementoId = complemento.Id,
                            MaximoPorProduto = complemento.MaximoPorProduto,
                            Obrigatorio = grupoExistente.Obrigatorio
                        };

                        produto.Complementos.Add(novoProdutoComplemento);
                    }
                }
            }
            await _context.SaveChangesAsync();
            return grupoExistente;
        }

        public async Task DeletarGrupoComplemento(int id)
        {
            var grupoComplemento = await _context.GrupoComplementos
                .Include(gc => gc.Complementos)
                .FirstOrDefaultAsync(gc => gc.Id == id);
            if (grupoComplemento == null) return;

            foreach (var complemento in grupoComplemento.Complementos)
            {
                complemento.GrupoComplementoId = null;
            }

            try
            {
                _context.GrupoComplementos.Remove(grupoComplemento);
                await _context.SaveChangesAsync();
            }
            catch (Exception e)
            {
                throw new Exception("Erro ao deletar grupo de complementos: " + e.Message);
            }
        }
    }
}
