using Amazon.S3.Transfer;
using Amazon.S3;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestao.Data;
using SistemaDeGestao.Models;
using SistemaDeGestao.Models.DTOs;
using System.Security.Claims;
using Amazon.S3.Model;
using System.Linq;
using SistemaDeGestao.Models.DTOs.Resquests;

namespace SistemaDeGestao.Services
{
    public class ProdutoService
    {
        private readonly DataBaseContext _context;
        private readonly IImageUploadService _imageUploadService;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly IAmazonS3 _s3Client;
        public ProdutoService(DataBaseContext context, IImageUploadService imageUploadService, IWebHostEnvironment webHostEnvironment,
            IAmazonS3 s3Client)
        {
            _context = context;
            _imageUploadService = imageUploadService;
            _webHostEnvironment = webHostEnvironment;
            _s3Client = s3Client;
        }

        public async Task<List<Produto>> ObterProdutosMaisVendidos(int restauranteId)
        {
            var produtosMaisVendidos = await _context.Pedidos
                .Where(p => p.RestauranteId == restauranteId)
                .SelectMany(p => p.Itens)
                .Where(ip => ip.Produto.LojaId == restauranteId && ip.Produto.Ativo)
                .GroupBy(ip => ip.ProdutoId)
                .Select(g => new
                {
                    ProdutoId = g.Key,
                    QuantidadeVendida = g.Sum(ip => ip.Quantidade)
                })
                .OrderByDescending(x => x.QuantidadeVendida)
                .Take(10)
                .ToListAsync();

            var produtoIds = produtosMaisVendidos.Select(x => x.ProdutoId).ToList();

            var produtos = await _context.Produtos
                .Where(p => produtoIds.Contains(p.Id))
                .ToListAsync();

            // Ordena os produtos na mesma ordem da quantidade vendida
            produtos = produtos
                .OrderByDescending(p => produtosMaisVendidos.First(x => x.ProdutoId == p.Id).QuantidadeVendida)
                .ToList();

            return produtos;
        }

        public async Task<List<Produto>> ListarProdutos(int lojaId)
        {
            var produtos = await _context.Produtos
            .Include(p => p.Complementos)
            .ThenInclude(pc => pc.Complemento)
            .Where(p => p.Restaurante.Id == lojaId)
            .ToListAsync();
            return produtos;
        }
        public async Task<Restaurante> ObterLojaPorSlug(string slug)
        {
            var loja = await _context.Restaurantes
                .Include(l => l.Categorias)
                .AsNoTracking()
                .FirstOrDefaultAsync(l => l.NomeDaLoja == slug);

            return loja;
        }

        public async Task<IEnumerable<Produto>> ListarProdutosPorLoja(int lojaId)
        {
            return await _context.Produtos
                .Include(p => p.Adicionais)
                    .ThenInclude(pa => pa.Adicional)
                .Include(p => p.Complementos)
                    .ThenInclude(pc => pc.Complemento)
                .Include(p => p.Categoria)
                .Where(p => p.Restaurante.Id == lojaId && p.Ativo)
                .AsNoTracking()
                .ToListAsync();
        }
        public async Task<Produto> CriarProdutoDTO(ProdutoDTO produtoDTO, string restauranteId, string NomeDaLoja)
        {
            try
            {
                if (string.IsNullOrEmpty(restauranteId)) throw new Exception("Usuário não autenticado.");
                if (!int.TryParse(restauranteId, out int lojaId)) throw new Exception("ID do restaurante inválido");
                var categoria = await _context.Categorias.FindAsync(produtoDTO.CategoriaId);
                if (categoria == null) throw new Exception($"Categoria não existe: {produtoDTO.CategoriaId}");

                var produto = new Produto
                {
                    Nome = produtoDTO.Nome,
                    Descricao = produtoDTO.Descricao,
                    CategoriaId = produtoDTO.CategoriaId,
                    PrecoCusto = produtoDTO.PrecoCusto,
                    PrecoVenda = produtoDTO.PrecoVenda,
                    EstoqueAtual = produtoDTO.EstoqueAtual,
                    EstoqueMinimo = produtoDTO.EstoqueMinimo,
                    UnidadeMedida = produtoDTO.UnidadeMedida,
                    Ativo = true,
                    DataCadastro = DateTime.Now,
                    LojaId = lojaId,
                    Complementos = new List<ProdutoComplemento>(), 
                    Adicionais = new List<ProdutoAdicional>(), 
                    ProdutosGruposComplementos = new List<ProdutoGrupoComplemento>(),
                };

                _context.Produtos.Add(produto);
                await _context.SaveChangesAsync();
                var categoriaAuxiliar = await _context.Categorias.FindAsync(produtoDTO.CategoriaId);
                if (categoriaAuxiliar == null) return null;
                // Processa a imagem do produto
                if (produtoDTO.ImagemPrincipalUrl != null)
                {
                    produto.ImagemPrincipalUrl = await UploadImagemParaS3(produtoDTO.ImagemPrincipalUrl, NomeDaLoja, categoriaAuxiliar.Nome, null);
                }


                // Adiciona complementos
                if (produtoDTO.GruposComplementosIds != null && produtoDTO.GruposComplementosIds.Any())
                {
                    foreach (var grupoComplementoId in produtoDTO.GruposComplementosIds)
                    {
                        var grupoComplemento = await _context.GrupoComplementos
                            .FirstOrDefaultAsync(g => g.Id == grupoComplementoId);

                        if (grupoComplemento != null)
                        {
                            var produtoGrupoComplemento = new ProdutoGrupoComplemento
                            {
                                ProdutoId = produto.Id,
                                GrupoComplementoId = grupoComplementoId
                            };
                            _context.ProdutosGruposComplementos.Add(produtoGrupoComplemento);
                            await VincularComplementoDoGrupoProduto(produto.Id, grupoComplementoId);
                        }
                        else
                        {
                            Console.WriteLine($"Grupo Complemento não encontrado para ID: {grupoComplementoId}");
                        }
                    }
                    await _context.SaveChangesAsync();
                }

                // Adiciona adicionais
                if (produtoDTO.GrupoAdicionalIds != null && produtoDTO.GrupoAdicionalIds.Any())
                {
                    foreach (var grupoAdicionalId in produtoDTO.GrupoAdicionalIds)
                    {
                        var grupoAdicional = await _context.GrupoAdicionais
                            .FirstOrDefaultAsync(g => g.Id == grupoAdicionalId);

                        if (grupoAdicional != null)
                        {
                            var produtoGrupoAdicional = new ProdutoGrupoAdicional
                            {
                                ProdutoId = produto.Id,
                                GrupoAdicionalId = grupoAdicionalId
                            };
                            _context.ProdutoGrupoAdicional.Add(produtoGrupoAdicional);
                            await VincularAdicionaisDoGrupoAdicional(produto.Id, grupoAdicionalId);
                        }
                        else
                        {
                            Console.WriteLine($"Grupo Adicional não encontrado para ID: {grupoAdicionalId}");
                        }
                    }
                }

                // Carregar as relações para retornar
                await _context.Entry(produto)
                    .Collection(p => p.Complementos)
                    .LoadAsync();

                await _context.Entry(produto)
                    .Collection(p => p.Adicionais)
                    .LoadAsync();
                await _context.SaveChangesAsync();
                return produto;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao criar produto: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }

        private async Task VincularAdicionaisDoGrupoAdicional(int produtoId, int grupoAdicionalId)
        {
            // Busca todos os adicionais que pertencem ao grupo de adicionais
            var adicionaisDoGrupo = await _context.Adicionais
                .Where(a => a.GrupoAdicionalId == grupoAdicionalId)
                .ToListAsync();

            foreach (var adicional in adicionaisDoGrupo)
            {
                var produtoAdicional = new ProdutoAdicional
                {
                    ProdutoId = produtoId,
                    AdicionalId = adicional.Id,
                    MaximoPorProduto = adicional.MaximoPorProduto,
                    PrecoAdicional = adicional.PrecoBase
                };

                _context.ProdutoAdicionais.Add(produtoAdicional);
            }

            await _context.SaveChangesAsync();
        }
        public async Task VincularComplementoDoGrupoProduto(int produtoId, int grupoComplementoId)
        {
            // Busca todos os adicionais que pertencem ao grupo de complemento
            var complementosDoGrupo = await _context.Complementos
                .Where(a => a.GrupoComplementoId == grupoComplementoId)
                .ToListAsync();

            foreach (var complemento in complementosDoGrupo)
            {
                var produtoComplemento = new ProdutoComplemento
                {
                    ProdutoId = produtoId,
                    ComplementoId = complemento.Id,
                    MaximoPorProduto = complemento.MaximoPorProduto,
                };
                _context.ProdutoComplementos.Add(produtoComplemento);
            }

            await _context.SaveChangesAsync();
        }

        public async Task<Produto> ObterProduto(int id)
        {
            try
            {
                var produto = await _context.Produtos
                .Include(p => p.Adicionais)
                    .ThenInclude(pa => pa.Adicional)
                .Include(p => p.Complementos)
                    .ThenInclude(pc => pc.Complemento)
                .Include(p => p.Categoria)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
                if (produto == null) return null;
                return produto;

            } catch (Exception ex)
            {
                Console.WriteLine($"Erro ao obter produto: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
                throw;
            }
        }

        public async Task<Produto> AtualizarProdutoV2(AtualizarProdutoRequestDto requestDto, string NomeDaLoja, string categoriaNome)
        {
            var produtoExistente = await _context.Produtos
                .Include(p => p.Complementos)
                .Include(p => p.Adicionais)
                .FirstOrDefaultAsync(p => p.Id == requestDto.Id);

            if (produtoExistente == null)
                return null;
            produtoExistente.Nome = requestDto.Nome;
            produtoExistente.PrecoVenda = requestDto.PrecoVenda;
            produtoExistente.Descricao = requestDto.Descricao;
            produtoExistente.CategoriaId = requestDto.CategoriaId;
            produtoExistente.EstoqueAtual = requestDto.EstoqueAtual;
            produtoExistente.EstoqueMinimo = requestDto.EstoqueMinimo;
            produtoExistente.UnidadeMedida = requestDto.UnidadeMedida;
            produtoExistente.PrecoCusto = requestDto.PrecoCusto;
            produtoExistente.Ativo = requestDto.Ativo;
            string? imagemAnteriorUrl = produtoExistente.ImagemPrincipalUrl;
            if (requestDto.ImagemPrincipalUrl != null && requestDto.ImagemPrincipalUrl.Length > 0)
            {
                // Passamos o IFormFile para o método de upload
                produtoExistente.ImagemPrincipalUrl = await UploadImagemParaS3(requestDto.ImagemPrincipalUrl, NomeDaLoja, categoriaNome, imagemAnteriorUrl);
            }
            var idsDoFrontend = requestDto.AdicionaisIds ?? new List<int>();

            var idsVinculadosAtualmente = produtoExistente.Adicionais
                .Select(pa => pa.AdicionalId)
                .ToList();

            var idsParaRemover = idsVinculadosAtualmente.Except(idsDoFrontend).ToList();
            if (idsParaRemover.Any())
            {
                var vinculosParaRemover = produtoExistente.Adicionais
                    .Where(pa => idsParaRemover.Contains(pa.AdicionalId))
                    .ToList();
                _context.RemoveRange(vinculosParaRemover);
            }

            var idsParaAdicionar = idsDoFrontend.Except(idsVinculadosAtualmente).ToList();
            if (idsParaAdicionar.Any())
            {
                foreach (var idAdicional in idsParaAdicionar)
                {
                    var novoVinculo = new ProdutoAdicional
                    {
                        ProdutoId = produtoExistente.Id,
                        AdicionalId = idAdicional
                    };
                    produtoExistente.Adicionais.Add(novoVinculo);
                }
            }

            var complementosIdsDoFrontend = requestDto.ComplementosIds ?? new List<int>();

            var complementosIdsVinculadosAtualmente = produtoExistente.Complementos
                .Select(pc => pc.ComplementoId)
                .ToList();

            var complementosIdsParaRemover = complementosIdsVinculadosAtualmente.Except(complementosIdsDoFrontend).ToList();
            if (complementosIdsParaRemover.Any())
            {
                var vinculosParaRemover = produtoExistente.Complementos
                    .Where(pc => complementosIdsParaRemover.Contains(pc.ComplementoId))
                    .ToList();
                _context.RemoveRange(vinculosParaRemover);
            }

            var complementosIdsParaAdicionar = complementosIdsDoFrontend.Except(complementosIdsVinculadosAtualmente).ToList();
            if (complementosIdsParaAdicionar.Any())
            {
                foreach (var idComplemento in complementosIdsParaAdicionar)
                {
                    var novoVinculo = new ProdutoComplemento
                    {
                        ProdutoId = produtoExistente.Id,
                        ComplementoId = idComplemento
                    };
                    produtoExistente.Complementos.Add(novoVinculo);
                }
            }
            await _context.SaveChangesAsync();
            return produtoExistente;
        }

        private async Task<string> UploadImagemParaS3(IFormFile imagem, string NomeDaLoja, string categoriaNome, string? imagemAnteriorUrl)
        {
            var fileTransferUtility = new TransferUtility(_s3Client);

            //Se houver uma URL da imagem anterior, exclui a imagem do S3
            if (!string.IsNullOrEmpty(imagemAnteriorUrl))
            {
                var imagemAnteriorKey = imagemAnteriorUrl?.Replace("https://sistemadegestao.s3.us-east-1.amazonaws.com/", "");

                if (!string.IsNullOrEmpty(imagemAnteriorKey))
                {
                    var deleteRequest = new DeleteObjectRequest
                    {
                        BucketName = "sistemadegestao",
                        Key = imagemAnteriorKey
                    };
                    await _s3Client.DeleteObjectAsync(deleteRequest);
                }
            }

            using (var newMemoryStream = new MemoryStream())
            {
                imagem.CopyTo(newMemoryStream);
                var currentDate = DateTime.Now.ToString("yyyyMMdd-HHmmss");
                var imageFileName = $"Imagem_{currentDate}-" + Path.GetExtension(imagem.FileName);
                var key = $"lojas/{NomeDaLoja}/{categoriaNome}/{imageFileName}";
                var uploadRequest = new TransferUtilityUploadRequest
                {
                    InputStream = newMemoryStream,
                    Key = key,
                    BucketName = "sistemadegestao",
                };
                await fileTransferUtility.UploadAsync(uploadRequest);
                return $"https://sistemadegestao.s3.us-east-1.amazonaws.com/{key}";
            }
        }
        public async Task DeletarProduto(int id)
        {
            var produto = await _context.Produtos.FindAsync(id);
            if (produto == null) return;
            _context.Remove(produto);
            await _context.SaveChangesAsync();
        }
        public async Task DeleteAll()
        {
            var produtos = _context.Produtos.ToList();

            if (!produtos.Any()) return;

            _context.Produtos.RemoveRange(produtos);
            await _context.SaveChangesAsync();
        }
    }
}
