import React, { useState } from 'react';
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

const Produtos = () => {
    const { nomeDaLoja } = useParams();
    const { lojaInfo, produtos, categorias, loading } = useLojaData(nomeDaLoja);
    const [activeCategory, setActiveCategory] = useState("todos");

    if (loading) return (
        <FuturisticLoadingSpinner
          message="Carregando os produtos..."
          accentColor="blue"
          secondaryColor="blue"
          darkMode={false}
          showBorder={false}
          phaseMessages={[
            "Aquecendo os motores...",
            "Preparando o cardápio...",
            "Finalizando os toques...",
            "Só mais um segundo..."
          ]}
        />
      );
      
      
    if (!lojaInfo) return <div>Loja não encontrada</div>;

    const filteredProducts = activeCategory === "todos"
        ? produtos
        : produtos.filter(prod => prod.categoriaId === Number(activeCategory));

    return (
        <div className="min-h-screen bg-white">
            <HeaderPublic />
            <div className="max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 pt-10">
                <CategoryFilter categories={categorias} activeCategory={activeCategory} setActiveCategory={setActiveCategory} />
                <FeaturedProducts products={produtos} />
            </div>
            <div>
            {filteredProducts.length > 0 ? (
                    categorias.map((categoria) => (
                        <CategorySection key={categoria.id} categoryName={categoria.nome} products={filteredProducts.filter(p => p.categoriaId === categoria.id)} />
                    ))
                ) : (
                    <EmptyResults />
                )}
            </div>
            <BottomNav />
            <BackToTopButton />
        </div>
    );

};
export default Produtos;
