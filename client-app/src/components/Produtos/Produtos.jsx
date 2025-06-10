import React, { useState, useEffect, useMemo  } from 'react';
import { useParams } from 'react-router-dom';
import HeaderPublic from '../HeaderPublic/HeaderPublic';
import StoreInfo from '../HeaderPublic/StoreInfo'; // Importação do StoreInfo, necessária para o layout
import BottomNav from '../BottomNav';
import useLojaData from './hooks/useLojaData';
import FuturisticLoadingSpinner from '../ui/FuturisticLoadingSpinner';
import CategoryFilter from './CategoryFilter';
import FeaturedProducts from './FeaturedProducts';
import CategorySection from './CategorySection';
import EmptyResults from './EmptyResults';
import BackToTopButton from './BackToTopButton';

const Produtos = () => {
  const { nomeDaLoja } = useParams();
  const { lojaInfo, produtos, categorias, loading } = useLojaData(nomeDaLoja);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [maisVendidos, setMaisVendidos] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");


   useEffect(() => {
  if (nomeDaLoja && !loading) {
    localStorage.setItem('fomedique_current_store', nomeDaLoja);

    const timer = setTimeout(() => {

      const novaUrl = '/';

      const novoTitulo = `${lojaInfo?.nome_loja || nomeDaLoja} | Fomedique`;

      // Agora isso vai funcionar perfeitamente
      window.history.pushState({ store: nomeDaLoja }, novoTitulo, novaUrl);
      document.title = novoTitulo;
    }, 3000);

    return () => clearTimeout(timer);
  }
}, [nomeDaLoja, loading, lojaInfo]);

  const finalFilteredProducts = useMemo(() => {
    let filtered = produtos;

    // 2. Primeiro, filtra pela categoria ativa
    if (activeCategory !== 'todos') {
      filtered = filtered.filter(prod => prod.categoriaId === Number(activeCategory));
    }

    // 3. Depois, filtra pelo termo da busca (se existir)
    if (searchTerm) {
      filtered = filtered.filter(prod =>
        prod.nome.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [produtos, activeCategory, searchTerm]);

  const categoriasComProdutosVisiveis = useMemo(() => {
    return categorias.filter(cat => 
      finalFilteredProducts.some(prod => prod.categoriaId === cat.id)
    );
  }, [categorias, finalFilteredProducts]);
  
  useEffect(() => {
    // Mantendo seu fetch original
    const fetchMaisVendidos = async () => {
      if (!nomeDaLoja) return;
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/1.0/produto/ListarMaisVendidosPorLoja/${nomeDaLoja}`);
        if (response.ok) setMaisVendidos(await response.json());
      } catch (error) { console.error("Erro ao buscar mais vendidos:", error); }
    };
    fetchMaisVendidos();
  }, [nomeDaLoja]);

  useEffect(() => {
    // Mantendo seu handleScroll original
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Guarda para o estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FuturisticLoadingSpinner message="Carregando..." />
      </div>
    );
  }

  // AQUI ESTÁ A CORREÇÃO CRUCIAL
  // Esta "guarda" impede que o código continue se lojaInfo for nulo,
  // prevenindo o erro "Cannot read properties of null".
  if (!lojaInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
        <h2 className="text-xl font-bold text-gray-700">Oops! Algo deu errado.</h2>
        <p className="text-gray-500 mt-2 mb-6">Não foi possível carregar as informações da loja.</p>
        <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">
          Tentar Novamente
        </button>
      </div>
    );
  }

  // Lógica de filtro mantida
  const filteredProducts = activeCategory === "todos" ? produtos : produtos.filter(prod => prod.categoriaId === Number(activeCategory));
  const categoriasComProdutos = categorias.filter(categoria => filteredProducts.some(produto => produto.categoriaId === categoria.id));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        {/* 4. Passamos a função `setSearchTerm` como prop para o Header */}
        <HeaderPublic 
          onSearchChange={setSearchTerm} 
          searchTerm={searchTerm}
          currentStore={nomeDaLoja}
      />
        
        <StoreInfo />
        
        <div className="border-t border-gray-200">
          <CategoryFilter
              categories={categorias}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
          />
        </div>
      </header>

      <main className="flex-grow pb-24">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">
          
          <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8">

                    {/* Exibe o banner apenas se não houver uma busca ativa */}
                    {lojaInfo.bannerUrl && !searchTerm && (
                        <div className="w-full h-40 md:h-56 rounded-lg overflow-hidden my-6">
                            <img src={lojaInfo.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* ========================================================= */}
                    {/* SEÇÃO "MAIS VENDIDOS" RESTAURADA E MELHORADA           */}
                    {/* ========================================================= */}
                    {/* Ela só aparece se:
                        1. Tiver produtos em 'maisVendidos'.
                        2. O usuário NÃO estiver digitando na busca.
                    */}
                    {maisVendidos.length > 0 && !searchTerm && (
                        <div className="my-8">
                            <FeaturedProducts products={maisVendidos} />
                        </div>
                    )}
                </div>

          {lojaInfo.bannerUrl && !searchTerm && (
            <div className="w-full h-40 md:h-56 rounded-lg overflow-hidden my-6">
              <img src={lojaInfo.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            </div>
          )}
          
          {/* Se estiver buscando, mostra um título com os resultados */}
          {searchTerm && (
            <div className="py-6">
                <h2 className="text-2xl font-bold text-gray-800">
                    Resultados para "{searchTerm}"
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                    {finalFilteredProducts.length} {finalFilteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
                </p>
            </div>
          )}

          <div className="space-y-8">
            {finalFilteredProducts.length > 0 ? (
              // Usamos o novo array `categoriasComProdutosVisiveis`
              categoriasComProdutosVisiveis.map((categoria) => (
                <CategorySection 
                  key={categoria.id} 
                  categoryName={categoria.nome} 
                  // Passamos os produtos já filtrados para a seção
                  products={finalFilteredProducts.filter(p => p.categoriaId === categoria.id)} 
                />
              ))
            ) : (
              // Mostra uma mensagem se não houver resultados para a busca/filtro
              <EmptyResults 
                message={searchTerm 
                    ? `Nenhum produto encontrado para "${searchTerm}".`
                    : 'Nenhum produto nesta categoria.'
                } 
              />
            )}
          </div>
        </div>
      </main>
      
      <BottomNav />
    </div>
  );
};
export default Produtos;
