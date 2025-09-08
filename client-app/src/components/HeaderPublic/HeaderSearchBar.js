import React, { useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

const HeaderSearchBar = ({
    isActive,
    searchTerm,
    onSearchChange,
    onActivate,
    onCancel
}) => {
    const inputRef = useRef(null);

    useEffect(() => {
        if (isActive) {
            // Pequeno delay para permitir a transição do CSS antes do foco
            const timer = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(timer);
        }
    }, [isActive]);
    
    // Reseta o scroll do input ao focar, útil no iOS
    const handleFocus = () => {
      if (inputRef.current) {
        inputRef.current.scrollLeft = 0;
      }
    };

    return (
        <div className={`absolute left-0 right-0 flex items-center transition-all duration-300 ease-in-out ${isActive ? 'w-full' : 'w-10 h-10 justify-end ml-auto'}`}>
            <div className="relative flex-1">
                {/* O ícone de busca agora está sempre presente mas pode estar sob o input */}
                <Search
                    onClick={onActivate}
                    className={`absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 z-10 ${isActive ? '' : 'text-white cursor-pointer'}`}
                />
                <input
                    ref={inputRef}
                    type="search"
                    placeholder={isActive ? "Buscar produtos na loja..." : ""}
                    className={`w-full h-10 pl-10 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0 cursor-pointer'}`}
                    onClick={onActivate}
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    onFocus={handleFocus}
                />
            </div>
            <div className="flex items-center space-x-2 pl-3">
                {isActive ? (
                    <button onClick={onCancel} className="text-sm font-semibold text-white hover:text-gray-300 whitespace-nowrap">
                        Cancelar
                    </button>
                ) : (
                    <div className="w-[18px]"></div> // Placeholder para evitar que o ShareButton pule
                )}
            </div>
        </div>
    );
};

export default HeaderSearchBar;