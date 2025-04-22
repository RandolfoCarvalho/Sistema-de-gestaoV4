using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;

namespace SistemaDeGestao.Services
{
    public class AdicionalService : Controller
    {
        private readonly DataBaseContext _context;

        public AdicionalService(DataBaseContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Adicional>> ListarAdicionais()
        {
            return await _context.Adicionais
                //.Include(a => a.GrupoAdicional)
                .Include(a => a.Produtos)
                .ToListAsync();
        }

        public async Task<Adicional> CriarAdicional(Adicional adicional)
        {
            _context.Adicionais.Add(adicional);
            await _context.SaveChangesAsync();
            return adicional;
        }
        public async Task<List<Adicional>> ObterAdicionaisPorProdutoId(int produtoId)
        {
            var adicionais = await _context.ProdutoAdicionais
                .Include(pa => pa.Adicional)
                .Where(pa => pa.ProdutoId == produtoId)
                .Select(pa => new Adicional
                {
                    Id = pa.AdicionalId,
                    Nome = pa.Adicional.Nome,
                    MaximoPorProduto = pa.MaximoPorProduto ,
                    Descricao = pa.Adicional.Descricao,
                    PrecoBase = pa.Adicional.PrecoBase,
                    Ativo = pa.Adicional.Ativo
                })
                .ToListAsync();

            return adicionais;
        }
        public async Task<Adicional> AtualizarAdicional(Adicional adicional)
        {
            if (adicional == null) return null;
            var adicionalExistente = await _context.Adicionais.FindAsync(adicional.Id);
            if (adicionalExistente == null) return null;
            _context.Entry(adicionalExistente).CurrentValues.SetValues(adicional);
            await _context.SaveChangesAsync();
            return adicionalExistente;
        }
        public async Task DeletarAdicional(int id)
        {
            var produto = await _context.Adicionais.FindAsync(id);
            if (produto == null) return;
            _context.Remove(produto);
            await _context.SaveChangesAsync();
        }

        //-------------------------------------------------------------------------------//
        // Grupos adicionais
        public async Task<IEnumerable<GrupoAdicional>> ListarGrupoAdicionaisAtivosEInativos(int restauranteId)
        {
            var grupoAdicionais = await _context.GrupoAdicionais
                .Include(ga => ga.Adicionais)
                .Where(ga => ga.RestauranteId == restauranteId)
                .ToListAsync();
            return grupoAdicionais;
        }
        public async Task<IEnumerable<GrupoAdicional>> ListarGrupoAdicionais(int restauranteId)
        {
            var grupoAdicionais = await _context.GrupoAdicionais
                .Where(g => g.Ativo)
                .Include(ga => ga.Adicionais)
                .Where(ga => ga.RestauranteId == restauranteId)
                .ToListAsync();
            return grupoAdicionais;
        }

        public async Task<GrupoAdicional> ListarGrupoAdicionalPorId(int id)
        {
            return await _context.GrupoAdicionais
                .Include(g => g.Adicionais)
                .Where(g => g.Id == id)
                .FirstOrDefaultAsync();
        }
        public async Task<IEnumerable<GrupoAdicional>> ListarGruposAdicionaisPorProduto(int produtoId)
        {
            var gruposAdicionais = await _context.GrupoAdicionais
                .Include(g => g.Adicionais.Where(a =>
                    a.Ativo && // Apenas adicionais ativos
                    a.Produtos.Any(pa => pa.ProdutoId == produtoId && pa.AdicionalId == a.Id)
                ))
                .OrderBy(g => g.Nome)
                .ToListAsync();

            return gruposAdicionais;
        }
        public async Task<IEnumerable<GrupoAdicional>> ListarGrupoAdicionaisPorProduto(int produtoId, int restauranteId)
        {
            var gruposAdicionais = await _context.GrupoAdicionais
                .Where(g => g.Ativo && g.Adicionais.Any(a => a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Include(g => g.Adicionais.Where(a => a.Ativo && a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Where(ga => ga.RestauranteId == restauranteId)
                .OrderBy(g => g.Nome)
                .ToListAsync();

            return gruposAdicionais;
        }
        public async Task<RestauranteGrupoAdicionalDto> ObterGrupoComplementoPorNome(string nomeDaLoja, int produtoId)
        {
            var restaurante = await _context.Restaurantes
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.NomeDaLoja.ToLower() == nomeDaLoja.ToLower());

            if (restaurante == null)
            {
                return null;
            }

            var gruposAdicionais = await _context.GrupoAdicionais
                .Where(g => g.Ativo && g.Adicionais.Any(a => a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Include(g => g.Adicionais.Where(a => a.Ativo && a.Produtos.Any(pa => pa.ProdutoId == produtoId)))
                .Where(g => g.RestauranteId == restaurante.Id)
                .OrderBy(g => g.Nome)
                .ToListAsync();

            return new RestauranteGrupoAdicionalDto
            {
                Restaurante = restaurante,
                GruposComplementos = gruposAdicionais
            };
        }

        public async Task<GrupoAdicional> CriarGrupoAdicional(GrupoAdicional grupoAdicional)
        {
            if (grupoAdicional == null)
                throw new ArgumentNullException(nameof(grupoAdicional));

            _context.GrupoAdicionais.Add(grupoAdicional);
            await _context.SaveChangesAsync();
            return grupoAdicional;
        }


        public async Task<IActionResult> AdicionarAdicionalAoGrupo(int adicionalId, int grupoAdicionalId)
        {
            var adicional = await _context.Adicionais
                .FirstOrDefaultAsync(a => a.Id == adicionalId);
            var grupoAdicional = await _context.GrupoAdicionais
                .FirstOrDefaultAsync(g => g.Id == grupoAdicionalId);
            if (adicional == null)
            {
                return NotFound("Adicional não encontrado.");
            }
            if (grupoAdicional == null)
            {
                return NotFound("Grupo de adicionais não encontrado.");
            }

            adicional.GrupoAdicionalId = grupoAdicionalId;
            try
            {
                _context.Adicionais.Update(adicional);
                await _context.SaveChangesAsync();
                return Ok("Adicional adicionado ao grupo com sucesso.");
            }
            catch (Exception ex)
            {
                return BadRequest($"Erro ao adicionar adicional ao grupo: {ex.Message}");
            }
        }

        public async Task<GrupoAdicional> AtualizarGrupoAdicional(GrupoAdicional grupoAdicional)
        {
            if (grupoAdicional == null) return null;

            // Primeiro carregamos o grupo existente com seus adicionais
            var grupoExistente = await _context.GrupoAdicionais
                .Include(g => g.Adicionais)
                .FirstOrDefaultAsync(g => g.Id == grupoAdicional.Id);

            if (grupoExistente == null) return null;

            //att gruop
            grupoExistente.Nome = grupoAdicional.Nome;
            grupoExistente.Ativo = grupoAdicional.Ativo;
            grupoExistente.LimiteSelecao = grupoAdicional.LimiteSelecao;

            //processa adicioanis
            if (grupoAdicional.Adicionais != null)
            {
                var adicionaisParaRemover = grupoExistente.Adicionais
                    .Where(a => !grupoAdicional.Adicionais.Any(na => na.Id == a.Id && a.Id != 0))
                    .ToList();

                foreach (var adicionalRemover in adicionaisParaRemover)
                {
                    _context.Adicionais.Remove(adicionalRemover);
                }

                // Processa cada adicional do payload
                foreach (var adicional in grupoAdicional.Adicionais)
                {
                    //adicional existe?
                    if (adicional.Id > 0)
                    {

                        var adicionalExistente = await _context.Adicionais.FindAsync(adicional.Id);
                        if (adicionalExistente != null)
                        {
                            adicionalExistente.Nome = adicional.Nome;
                            adicionalExistente.Descricao = adicional.Descricao;
                            adicionalExistente.PrecoBase = adicional.PrecoBase;
                            adicionalExistente.Ativo = adicional.Ativo;
                            adicionalExistente.MaximoPorProduto = adicional.MaximoPorProduto;
                            adicionalExistente.GrupoAdicionalId = grupoExistente.Id;
                            _context.Adicionais.Update(adicionalExistente);
                        }
                    }
                    else
                    {
                        var novoAdicional = new Adicional
                        {
                            Nome = adicional.Nome,
                            Descricao = adicional.Descricao,
                            PrecoBase = adicional.PrecoBase,
                            Ativo = adicional.Ativo,
                            MaximoPorProduto = adicional.MaximoPorProduto,
                            GrupoAdicionalId = grupoExistente.Id
                        };

                        _context.Adicionais.Add(novoAdicional);
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Recarregamos o grupo com seus adicionais atualizados
            await _context.Entry(grupoExistente)
                .Collection(g => g.Adicionais)
                .LoadAsync();

            // Busca todos os produtos associados a qualquer adicional do grupo
            var produtosAssociados = await _context.Produtos
                .Include(p => p.Adicionais)
                .Where(p => p.Adicionais.Any(pa => grupoExistente.Adicionais.Select(ga => ga.Id).Contains(pa.AdicionalId)))
                .ToListAsync();

            // Para cada produto, garantimos que exista uma relação com todos os adicionais do grupo
            foreach (var produto in produtosAssociados)
            {
                foreach (var adicional in grupoExistente.Adicionais)
                {
                    var existeProdutoAdicional = produto.Adicionais.Any(pa => pa.AdicionalId == adicional.Id);

                    if (!existeProdutoAdicional)
                    {
                        var novoProdutoAdicional = new ProdutoAdicional
                        {
                            ProdutoId = produto.Id,
                            AdicionalId = adicional.Id,
                            MaximoPorProduto = adicional.MaximoPorProduto,
                        };

                        produto.Adicionais.Add(novoProdutoAdicional);
                    }
                }
            }
            await _context.SaveChangesAsync();
            return grupoExistente;
        }

        public async Task DeletarGrupoAdicional(int id)
        {
            using (var transaction = await _context.Database.BeginTransactionAsync())
            {
                try
                {
                    var grupoAdicional = await _context.GrupoAdicionais
                        .Include(ga => ga.Adicionais)
                        .FirstOrDefaultAsync(ga => ga.Id == id);
                    if (grupoAdicional == null) return;
                    if (grupoAdicional.Adicionais != null && grupoAdicional.Adicionais.Any())
                    {
                        _context.Adicionais.RemoveRange(grupoAdicional.Adicionais);
                    }
                    _context.GrupoAdicionais.Remove(grupoAdicional);

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (Exception e)
                {
                    await transaction.RollbackAsync();
                    throw new Exception("Erro ao deletar grupo de adicionais: " + e.Message);
                }
            }
        }

    }
}