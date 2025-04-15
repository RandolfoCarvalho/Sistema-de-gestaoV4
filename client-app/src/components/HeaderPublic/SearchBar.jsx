import React, { useState } from "react";
import { useSearchProducts } from "./hooks/useSearchProducts";

const SearchBar = () => {
    const { searchTerm, setSearchTerm, produtos, loading } = useSearchProducts();

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
                        {loading ? <p className="text-center p-2">Carregando...</p> :
                            produtos.map((produto) => (
                                <div key={produto.id} className="px-4 py-2 hover:bg-gray-100 cursor-pointer">
                                    {produto.nome}
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchBar;
