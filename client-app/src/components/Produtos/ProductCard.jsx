// src/components/Produtos/ProductCard.jsx

import React from 'react';
import { Link } from 'react-router-dom';

// Função auxiliar para formatar preço em Reais (BRL) - sem alterações
const formatPrice = (price) => {
  const numericPrice = Number(price) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericPrice);
};

const ProductCard = ({ product }) => {
  // Desestruturação dos dados do produto - sem alterações
  const {
    id,
    nome,
    descricao,
    precoVenda,
    imagemPrincipalUrl,
    estoqueAtual,
    estoqueMinimo,
  } = product;

  // Lógica de verificação de estoque - sem alterações
  const isOutOfStock = estoqueAtual === 0;
  const isLastUnit = estoqueAtual === 1;
  const isLowStock = !isLastUnit && estoqueAtual > 0 && estoqueAtual <= estoqueMinimo;

  let urgencyMessage = null;
  if (isLastUnit) {
    urgencyMessage = 'Última unidade!';
  } else if (isLowStock) {
    urgencyMessage = 'Quase esgotado!';
  }

  // ---- [ INÍCIO DAS MELHORIAS VISUAIS ] ----

  // Componente que renderiza o conteúdo do card, agora com estilos aprimorados
  const CardContent = () => (
    <div
      className={`
        flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm 
        transition-all duration-300 ease-in-out
        ${isOutOfStock 
          ? 'cursor-not-allowed' 
          : 'hover:shadow-lg hover:-translate-y-1'
        }
      `}
    >
      {/* Container principal do conteúdo, que ficará em escala de cinza se esgotado */}
      <div className={`flex-1 min-w-0 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}>
        {/* Lado do texto com tipografia refinada */}
        <div className="flex flex-col h-full">
          <h3 className="text-md font-semibold text-gray-800 line-clamp-1">{nome}</h3>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-snug flex-grow">
            {descricao}
          </p>
          <div className="mt-2">
            <span className="text-xl font-bold text-emerald-600">
              {formatPrice(precoVenda)}
            </span>
          </div>
        </div>
      </div>

      {/* Lado da imagem com bordas redondas */}
      <div className={`relative flex-shrink-0 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}>
        <div className="relative w-24 h-24">
          <img
            src={imagemPrincipalUrl || "https://via.placeholder.com/100x100?text=Sem+Img"}
            alt={nome}
            className="w-full h-full object-cover rounded-full" // <- AQUI A IMAGEM FICA REDONDA
          />
          {/* Badge de Urgência com estilo melhorado */}
          {urgencyMessage && (
            <div 
              className="absolute bottom-0 right-0 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10
                         ring-2 ring-white" // Anel branco para destacar o badge
            >
              {urgencyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ---- [ FIM DAS MELHORIAS VISUAIS ] ----

  return (
    <div className="relative">
      {/* Se o produto estiver esgotado, renderiza um <div> não clicável */}
      {isOutOfStock ? (
        <div>
          <CardContent />
          {/* Overlay de produto indisponível com estilo mais limpo */}
          <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-sm flex items-center justify-center rounded-xl z-20">
            <span className="font-bold text-slate-600 text-center bg-slate-200/90 py-2 px-4 rounded-lg shadow-sm">
              Indisponível
            </span>
          </div>
        </div>
      ) : (
        // Caso contrário, renderiza um <Link> clicável
        <Link to={`/product/${id}`} className="block">
          <CardContent />
        </Link>
      )}
    </div>
  );
};

export default ProductCard;