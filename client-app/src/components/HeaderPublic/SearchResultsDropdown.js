// SearchResultsDropdown.js
import React from 'react';
import { useNavigate } from 'react-router-dom';

const SearchResultsDropdown = ({ produtos, loading, onProdutoClick }) => {
    const navigate = useNavigate();

    // Se não há produtos e não está carregando, não mostra nada.
    if (!loading && produtos.length === 0) {
        return null;
    }

    return (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-b-lg mt-1 max-h-60 overflow-y-auto z-50">
            {loading ? (
                <p className="text-center p-2 text-sm text-gray-500">Buscando...</p>
            ) : (
                produtos.map((produto) => (
                    <div
                        key={produto.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                        onClick={() => onProdutoClick(produto.id)}
                    >
                        <img
                            src={produto.imagemPrincipalUrl || "/api/placeholder/40/40"}
                            alt={produto.nome}
                            className="w-10 h-10 object-cover rounded-md"
                        />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{produto.nome}</p>
                            <p className="text-xs text-blue-600 font-semibold">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(produto.precoVenda)}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default SearchResultsDropdown;