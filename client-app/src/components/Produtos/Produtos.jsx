import React, { useState, useEffect, useMemo  } from 'react';
import { useParams } from 'react-router-dom';
import HeaderPublic from '../HeaderPublic/HeaderPublic';
import StoreInfo from '../HeaderPublic/StoreInfo';
import BottomNav from '../BottomNav';
import useLojaData from './hooks/useLojaData';
import CategoryFilter from './CategoryFilter';
import FeaturedProducts from './FeaturedProducts';
import CategorySection from './CategorySection';
import EmptyResults from './EmptyResults';
import ProductPageSkeleton from '../ui/skeleton/ProductPageSkeleton';

const Produtos = () => {
  const { nomeDaLoja } = useParams();
  const { lojaInfo, produtos, categorias, loading } = useLojaData(nomeDaLoja);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [maisVendidos, setMaisVendidos] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const finalFilteredProducts = useMemo(() => {
    let filtered = produtos;
    if (activeCategory !== 'todos') {
      filtered = filtered.filter(prod => prod.categoriaId === Number(activeCategory));
    }
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
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading) {
    return <ProductPageSkeleton />;
  }

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

  const filteredProducts = activeCategory === "todos" ? produtos : produtos.filter(prod => prod.categoriaId === Number(activeCategory));
  const categoriasComProdutos = categorias.filter(categoria => filteredProducts.some(produto => produto.categoriaId === categoria.id));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-20 bg-white shadow-sm">
        <HeaderPublic 
          onSearchChange={setSearchTerm} 
          searchTerm={searchTerm}
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
                    {lojaInfo.bannerUrl && !searchTerm && (
                        <div className="w-full h-40 md:h-56 rounded-lg overflow-hidden my-6">
                            <img src={lojaInfo.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                        </div>
                    )}

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
              categoriasComProdutosVisiveis.map((categoria) => (
                <CategorySection 
                  key={categoria.id} 
                  categoryName={categoria.nome} 
                  products={finalFilteredProducts.filter(p => p.categoriaId === categoria.id)} 
                />
              ))
            ) : (
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