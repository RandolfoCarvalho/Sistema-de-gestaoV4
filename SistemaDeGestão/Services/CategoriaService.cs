using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SistemaDeGestão.Data;
using SistemaDeGestão.Models;

namespace SistemaDeGestão.Services
{
    public class CategoriaService : Controller
    {
        private readonly DataBaseContext _context;
        public CategoriaService(DataBaseContext context)
        {
            _context = context;
        }
        public async Task<IEnumerable<Categoria>> ListarCategorias(int restauranteId)
        {
            return await _context.Categorias
                .Where(ga => ga.RestauranteId == restauranteId)
                .ToListAsync();
        }
        public async Task<IEnumerable<Categoria>> ListarCategoriasPorLoja(int restauranteId)
        {
            return await _context.Categorias
                .Where(c => c.RestauranteId == restauranteId)
                .AsNoTracking()
                .ToListAsync();
        }
        public async Task<Categoria> CriarCategoria(Categoria categoria)
        {
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();
            return categoria;
        }
        public async Task<IActionResult> AdicionarCategoriaAoProduto(int produtoId, int categoriaId)
        {
            var produto = await _context.Produtos.FindAsync(produtoId);
            var categoria = await _context.Categorias.FindAsync(categoriaId);
            if (produto == null || categoria == null) return null;
            produto.CategoriaId = categoriaId; 
            await _context.SaveChangesAsync();
            return Ok("Categoria adiciona ao Produto com sucesso!");
        }
        public async Task<Categoria> AtualizarCategoria(Categoria categoria)
        {
            if (categoria == null) return null;
            var categoriaExistente = await _context.Categorias.FindAsync(categoria.Id);
            if (categoriaExistente == null) return null;
            _context.Entry(categoriaExistente).CurrentValues.SetValues(categoria);
            await _context.SaveChangesAsync();
            return categoriaExistente;
        }
        public async Task DeletarCategoria(int id)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return;
            _context.Remove(categoria);
            await _context.SaveChangesAsync();
        }
    }
}
