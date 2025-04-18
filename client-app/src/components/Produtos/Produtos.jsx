import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import HeaderPublic from '../HeaderPublic/HeaderPublic';
import BottomNav from '../BottomNav';
import useLojaData from './hooks/useLojaData';
import FuturisticLoadingSpinner from '../ui/FuturisticLoadingSpinner';
import CategoryFilter from './CategoryFilter';
import FeaturedProducts from './FeaturedProducts';
import CategorySection from './CategorySection';
import EmptyResults from './EmptyResults';
import BackToTopButton from './BackToTopButton';

const loadingMessages = [
  "Aquecendo os motores...",
  "Preparando o cardápio...",
  "Finalizando os toques...",
  "Só mais um segundo..."
];

const Produtos = () => {
  const { nomeDaLoja } = useParams();
  const { lojaInfo, produtos, categorias, loading } = useLojaData(nomeDaLoja);
  const [activeCategory, setActiveCategory] = useState("todos");
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Controla a visibilidade do botão "Voltar ao topo"
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Renderização de estado de carregamento
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <FuturisticLoadingSpinner
          message="Carregando os produtos..."
          accentColor="red"
          secondaryColor="gray"
          darkMode={false}
          showBorder={false}
          phaseMessages={loadingMessages}
        />
      </div>
    );
  }
  
  // Renderização de estado de erro
  if (!lojaInfo) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Loja não encontrada</h2>
        <p className="text-gray-600 mb-4">Não conseguimos encontrar a loja que você está procurando.</p>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Voltar
        </button>
      </div>
    );
  }

  // Filtra produtos pela categoria selecionada
  const filteredProducts = activeCategory === "todos"
    ? produtos
    : produtos.filter(prod => prod.categoriaId === Number(activeCategory));

  // Filtra categorias que possuem produtos
  const categoriasComProdutos = categorias.filter(categoria => 
    filteredProducts.some(produto => produto.categoriaId === categoria.id)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <HeaderPublic />
      
      <main className="flex-grow pb-16">
        <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 pt-4 md:pt-6">
          {/* Banner da loja (opcional) */}
          {lojaInfo.bannerUrl && (
            <div className="w-full h-40 md:h-56 rounded-lg overflow-hidden mb-6">
              <img 
                src={lojaInfo.bannerUrl || "/api/placeholder/1200/300"} 
                alt={`${lojaInfo.nome} banner`}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Informações da loja (opcional) */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{lojaInfo.nome}</h1>
            {lojaInfo.descricao && (
              <p className="text-gray-600 mt-1">{lojaInfo.descricao}</p>
            )}
          </div>
        
          {/* Filtro de categorias */}
          <div className="sticky top-0 z-10 bg-gray-50 py-2 -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 shadow-sm">
            <CategoryFilter 
              categories={categorias} 
              activeCategory={activeCategory} 
              setActiveCategory={setActiveCategory} 
            />
          </div>
          
          {/* Produtos em destaque */}
          <div className="mt-6">
            <FeaturedProducts products={produtos} />
          </div>
          
          {/* Seções de categorias */}
          
        </div>
        <div className="mt-8 space-y-8">
            {filteredProducts.length > 0 ? (
              categoriasComProdutos.map((categoria) => (
                <CategorySection 
                  key={categoria.id} 
                  categoryName={categoria.nome} 
                  products={filteredProducts.filter(p => p.categoriaId === categoria.id)} 
                />
              ))
            ) : (
              <EmptyResults />
            )}
          </div>
      </main>
      
      {showBackToTop && <BackToTopButton />}
      <BottomNav />
    </div>
  );
};

export default Produtos;