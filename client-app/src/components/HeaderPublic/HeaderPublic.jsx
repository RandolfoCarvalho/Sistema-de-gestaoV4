import React, { useState, useEffect, useRef } from 'react';
import { Search, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../Context/StoreContext';
import { useSearchProducts } from './hooks/useSearchProducts'; // Agora usado internamente
import SearchResultsDropdown from './SearchResultsDropdown'; // Componente de UI para os resultados
import Swal from 'sweetalert2';
// O Header aceita props opcionais para o modo de "busca dinâmica"
const HeaderPublic = ({ onSearchChange, currentStore, searchTerm: controlledSearchTerm }) => {
    const navigate = useNavigate();
    const { fantasyName, storeInfo } = useStore();
    const [isSearchActive, setIsSearchActive] = useState(false);
    const logoUrl = storeInfo?.imagemUrl;
    const inputRef = useRef(null);
    const headerRef = useRef(null);

    const handleShare = async () => {
        // Guarda de segurança: não faz nada se por algum motivo não soubermos a loja.
        if (!currentStore) {
            console.error("Não foi possível determinar a loja para compartilhar.");
            return;
        }

        // 1. Monte a URL completa e correta
        const shareUrl = `${window.location.origin}/loja/${currentStore}`;
        const storeName = currentStore.charAt(0).toUpperCase() + currentStore.slice(1);

        const shareData = {
            title: `Confira o cardápio de ${storeName}!`,
            text: `Estou fazendo meu pedido em ${storeName} pelo Fomédique. Peça você também!`,
            url: shareUrl,
        };

        // 2. Tenta usar a API de compartilhamento nativa (melhor para mobile)
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                console.log('Loja compartilhada com sucesso!');
            } catch (err) {
                console.error('Erro ao compartilhar:', err);
            }
        } else {
            // 3. Fallback: Se não houver API, copia para a área de transferência (desktop)
            try {
                await navigator.clipboard.writeText(shareUrl);
                alert('Link da loja copiado para a área de transferência!');
            } catch (err) {
                console.error('Falha ao copiar o link:', err);
                alert('Não foi possível copiar o link.');
            }
        }
    };

    // --- LÓGICA DE CONTROLE ---
    // Verifica se está no modo "dinâmico" (controlado pela página Produtos)
    const isDynamicSearchMode = onSearchChange !== undefined;

    // --- LÓGICA DE BUSCA INTERNA (para páginas como Checkout) ---
    // Usa o hook useSearchProducts somente se NÃO estiver no modo dinâmico
    const internalSearch = useSearchProducts();
    
    // --- SELEÇÃO DE ESTADO E FUNÇÕES ---
    // Se estiver no modo dinâmico, usa as props. Senão, usa a busca interna.
    const searchTerm = isDynamicSearchMode ? controlledSearchTerm : internalSearch.searchTerm;
    const setSearchTerm = isDynamicSearchMode ? onSearchChange : internalSearch.setSearchTerm;
    const produtos = isDynamicSearchMode ? [] : internalSearch.produtos; // Só precisamos dos produtos no modo dropdown
    const loading = isDynamicSearchMode ? false : internalSearch.loading; // E do loading também


    // --- Handlers de UI ---
    const handleStoreClick = () => navigate(`/`);
    const handleActivateSearch = () => setIsSearchActive(true);
    const handleDeactivateSearch = () => {
        setIsSearchActive(false);
        setSearchTerm(''); // Limpa tanto o estado do pai quanto o interno
    };

    const handleProdutoClick = (id) => {
        navigate(`/product/${id}`);
        handleDeactivateSearch();
    };

    // --- Efeitos ---
    useEffect(() => {
        if (isSearchActive) setTimeout(() => inputRef.current?.focus(), 50);
    }, [isSearchActive]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (headerRef.current && !headerRef.current.contains(event.target)) {
                if (isSearchActive) handleDeactivateSearch();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isSearchActive]);


    return (
        <div ref={headerRef} className="w-full bg-gray-900 relative z-30 border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    
                    {/* Logo e Nome da Loja */}
                    <div
                        onClick={handleStoreClick}
                        className={`flex items-center space-x-3 cursor-pointer transition-opacity duration-300 ${isSearchActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                    >
                        <div className="w-10 h-10 bg-gray-100 rounded-full overflow-hidden">
                            <img src={logoUrl || "/api/placeholder/40/40"} alt="Logo da loja" className="w-full h-full object-cover" />
                        </div>
                        <h1 className="text-lg font-bold text-white sm:block">{fantasyName || "Loja"}</h1>
                    </div>

                    {/* Barra de Busca que se expande */}
                    <div className={`absolute left-0 right-0 flex items-center transition-all duration-300 ease-in-out ${isSearchActive ? 'w-full' : 'w-10 h-10 justify-end ml-auto'}`}>
                        <div className="relative flex-1">
                            <input
                                ref={inputRef}
                                type="search"
                                placeholder={isSearchActive ? "Buscar produtos na loja..." : ""}
                                className={`w-full h-10 pl-10 pr-4 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-300 ${isSearchActive ? 'opacity-100' : 'opacity-0 cursor-pointer'}`}
                                onClick={!isSearchActive ? handleActivateSearch : undefined}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <Search onClick={handleActivateSearch} className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white cursor-pointer" />
                        </div>

                        {/* Botões de Ação */}
                        <div className="flex items-center space-x-2 pl-3">
                            {isSearchActive ? (
                                <button onClick={handleDeactivateSearch} className="text-sm font-semibold text-blue-600 hover:text-blue-800 whitespace-nowrap">
                                    Cancelar
                                </button>
                            ) : (
                                <button
                                    onClick={handleShare} 
                                    className="p-2 text-white hover:bg-gray-100 rounded-full"
                                    title="Compartilhar loja"
                                >
                                    <Share2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* O Dropdown só é renderizado se:
                1. A busca estiver ativa.
                2. NÃO estivermos no modo dinâmico (ou seja, estamos no Checkout, etc.).
                3. Houver um termo de busca.
            */}
            {isSearchActive && !isDynamicSearchMode && searchTerm && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <SearchResultsDropdown
                        produtos={produtos}
                        loading={loading}
                        onProdutoClick={handleProdutoClick}
                    />
                </div>
            )}
        </div>
    );
};

export default HeaderPublic;