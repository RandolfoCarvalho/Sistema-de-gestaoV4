import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import EditarProdutoModal from './EditarProdutoModal';
import api from '../../../axiosConfig';
import { confirmAction, showError, showSuccess } from "@utils/alerts";

const GestaoComponent = () => {
    const [produtos, setProdutos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [categoriaSelecionada, setCategoriaSelecionada] = useState('todas');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [produtoEditando, setProdutoEditando] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const [produtosResponse, categoriasResponse] = await Promise.all([
                    api.get('/api/1.0/Produto/ListarProdutos'),
                    api.get('/api/1.0/Categoria/ListarCategorias')
                ]);
                setProdutos(produtosResponse.data || []);
                setCategorias(categoriasResponse.data || []);
            } catch (err) {
                console.error('Erro ao buscar dados:', err);
                setError('Ocorreu um erro ao carregar os dados. Tente novamente.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const produtosFiltrados = useMemo(() => {
        if (categoriaSelecionada === 'todas') return produtos;
        return produtos.filter(produto => produto.categoriaId === parseInt(categoriaSelecionada));
    }, [produtos, categoriaSelecionada]);

    const produtosPorCategoria = useMemo(() => {
        if (!categorias.length) return {};
        const agrupados = categoriaSelecionada === 'todas'
            ? categorias.reduce((acc, categoria) => {
                const produtosDaCategoria = produtos.filter(produto => produto.categoriaId === categoria.id);
                if (produtosDaCategoria.length > 0) acc[categoria.id] = produtosDaCategoria;
                return acc;
            }, {})
            : { [categoriaSelecionada]: produtosFiltrados.filter(p => p.categoriaId === parseInt(categoriaSelecionada)) };
        
        if (categoriaSelecionada !== 'todas' && (!agrupados[categoriaSelecionada] || agrupados[categoriaSelecionada].length === 0)) {
            return {};
        }
        return agrupados;
    }, [produtos, categorias, categoriaSelecionada, produtosFiltrados]);

    const handleDelete = useCallback(async (id) => {
        const result = await confirmAction("Você tem certeza?", "Esse produto será excluído!");
        if (result.isConfirmed) {
            try {
                await axios.delete(`${process.env.REACT_APP_API_URL}/api/1.0/Produto/DeletarProduto/${id}`);
                setProdutos(prevProdutos => prevProdutos.filter(produto => produto.id !== id));
                showSuccess("Produto excluído!", "O produto foi excluído com sucesso.");
            } catch (err) {
                console.error("Ocorreu um erro ao excluir o produto:", err);
                showError("Erro!", "Apenas administradores podem excluir; desative o produto se necessário:.");
            }
        }
    }, []);

    const handleEdit = useCallback((produto) => {
        setProdutoEditando(produto);
        setModalAberto(true);
    }, []);

    const handleSaveEdit = useCallback((produtoAtualizado) => {
        setProdutos(prevProdutos =>
            prevProdutos.map(p => (p.id === produtoAtualizado.id ? produtoAtualizado : p))
        );
        setModalAberto(false);
        showSuccess("Produto atualizado!", "As alterações foram salvas.");
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <p className="text-xl font-medium text-slate-600">Carregando produtos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 p-4 sm:p-8 flex items-center justify-center">
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-6 rounded-md shadow-md max-w-lg text-center">
                    <h3 className="font-bold text-lg mb-2">Ocorreu um Erro</h3>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    const categoriasVisiveis = Object.keys(produtosPorCategoria);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-sky-100 p-4 sm:p-6 md:p-8 font-sans">
            <header className="mb-8 sm:mb-10 text-center"> {/* Reduzida margem inferior */}
                <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-500 to-indigo-600 py-2"> {/* Reduzido tamanho da fonte */}
                    Gestão de Produtos
                </h1>
            </header>

            <div className="mb-8 sm:mb-10 flex justify-center"> {/* Reduzida margem inferior */}
                <select
                    value={categoriaSelecionada}
                    onChange={(e) => setCategoriaSelecionada(e.target.value)}
                    className="w-full max-w-md p-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg shadow-sm
                               focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow" // Reduzido padding e fonte
                    aria-label="Selecionar categoria de produtos"
                >
                    <option value="todas">Todas as Categorias</option>
                    {categorias.map(categoria => (
                        <option key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                        </option>
                    ))}
                </select>
            </div>

            {categoriasVisiveis.length > 0 ? (
                categoriasVisiveis.map(categoriaId => {
                    const categoria = categorias.find(cat => cat.id === parseInt(categoriaId));
                    const produtosDaCategoria = produtosPorCategoria[categoriaId];

                    if (!produtosDaCategoria || produtosDaCategoria.length === 0) return null;

                    return (
                        <section key={categoriaId} className="mb-10 sm:mb-12" aria-labelledby={`category-title-${categoriaId}`}> {/* Reduzida margem inferior */}
                            <h2 id={`category-title-${categoriaId}`}
                                className="text-xl sm:text-2xl font-semibold text-slate-700 mb-5 pb-2 border-b-2 border-sky-200"> {/* Reduzido tamanho da fonte e margem inferior */}
                                {categoria?.nome || 'Categoria Desconhecida'}
                            </h2>
                            {/* Ajustado o gap do grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {produtosDaCategoria.map(produto => (
                                    <article key={produto.id}
                                        className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col group
                                                   transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.02]"
                                        aria-labelledby={`product-name-${produto.id}`}
                                    >
                                        {/* Altura da imagem reduzida */}
                                        <div className="relative overflow-hidden h-44"> {/* Era h-52 */}
                                            <img
                                                src={produto.imagemPrincipalUrl || `https://via.placeholder.com/300x200.png?text=${encodeURIComponent(produto.nome || 'Produto')}`}
                                                alt={produto.nome || 'Imagem do produto'}
                                                className="w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                                            />
                                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity duration-300"></div>
                                        </div>
                                        
                                        {/* Padding interno do card reduzido */}
                                        <div className="p-4 flex flex-col flex-grow"> {/* Era p-5 */}
                                            <h3 id={`product-name-${produto.id}`}
                                                // Fonte e margem do nome do produto reduzidos
                                                className="text-base font-semibold text-slate-800 mb-1 truncate group-hover:text-sky-600 transition-colors"> {/* Era text-lg */}
                                                {produto.nome || 'Produto sem nome'}
                                            </h3>
                                            {/* Fonte da descrição e margem reduzidas, line-clamp pode ser ajustado se necessário */}
                                            <p className="text-xs text-slate-600 mb-2 flex-grow line-clamp-3 leading-relaxed"> {/* Era text-sm mb-3 */}
                                                {produto.descricao || 'Sem descrição disponível.'}
                                            </p>
                                            {/* Fonte e margem do preço reduzidos */}
                                            <p className="text-lg font-bold text-sky-600 mb-3"> {/* Era text-xl mb-4 */}
                                                R$ {produto.precoVenda?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                            </p>
                                            {/* Gap e padding dos botões ajustados */}
                                            <div className="mt-auto flex flex-col sm:flex-row gap-2"> {/* Era gap-3 */}
                                                <button
                                                    onClick={() => handleEdit(produto)}
                                                    // Padding e fonte dos botões reduzidos
                                                    className="w-full sm:flex-1 py-2 px-3 bg-sky-500 text-white text-xs font-medium rounded-md shadow-sm
                                                               hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 
                                                               transition-all duration-150 ease-in-out transform hover:scale-105" // Era py-2.5 px-4 text-sm
                                                    aria-label={`Editar ${produto.nome}`}
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(produto.id)}
                                                    className="w-full sm:flex-1 py-2 px-3 bg-rose-500 text-white text-xs font-medium rounded-md shadow-sm
                                                               hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2
                                                               transition-all duration-150 ease-in-out transform hover:scale-105" // Era py-2.5 px-4 text-sm
                                                    aria-label={`Excluir ${produto.nome}`}
                                                >
                                                    Excluir
                                                </button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    );
                })
            ) : (
                <div className="text-center py-10 sm:py-12"> {/* Reduzido padding vertical */}
                    <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"> {/* Reduzido tamanho do ícone */}
                        <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-base sm:text-lg font-medium text-slate-800">Nenhum produto encontrado</h3> {/* Reduzido tamanho da fonte */}
                    <p className="mt-1 text-xs sm:text-sm text-slate-500"> {/* Reduzido tamanho da fonte */}
                        {categoriaSelecionada === 'todas' && produtos.length === 0
                            ? 'Parece que ainda não há produtos cadastrados.'
                            : 'Tente selecionar outra categoria ou verifique os filtros.'}
                    </p>
                </div>
            )}

            {produtoEditando && (
                <EditarProdutoModal
                    produto={produtoEditando}
                    modalAberto={modalAberto}
                    setModalAberto={setModalAberto}
                    onSave={handleSaveEdit}
                />
            )}
        </div>
    );
};

export default GestaoComponent;