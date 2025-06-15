import React from "react";
import { useSearchProducts } from "./hooks/useSearchProducts";
import { useNavigate } from "react-router-dom";
import Produtos from "../Produtos/Produtos";

const SearchBar = () => {
    const { searchTerm, setSearchTerm, produtos, loading } = useSearchProducts();
    const navigate = useNavigate();

    const handleProdutoClick = (id) => {
        navigate(`/product/${id}`);
    };
    return (
        <div className="py-3 px-2 border-t border-blue-400">
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar produtos..."
                    className="pl-4 pr-4 py-2 w-full rounded-full border border-blue-400 focus:ring-2 focus:ring-blue-300 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
                {searchTerm && produtos.length > 0 && (
                    <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-b-lg mt-1 max-h-60 overflow-y-auto z-50">
                        {loading ? (
                            <p className="text-center p-2">Carregando...</p>
                        ) : (
                            produtos.map((produto) => (
                                <div
                                    key={produto.id}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleProdutoClick(produto.id)}
                                >
                                    <img
                                        src={produto.imagemPrincipalUrl || "/api/placeholder/40/40"}
                                        alt={produto.nome}
                                        className="w-10 h-10 object-cover rounded-md"
                                    />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{produto.nome}</p>
                                        <p className="text-xs text-gray-500">R$ {produto.precoVenda.toFixed(2).replace(".", ",")}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
