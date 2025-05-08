import React, { useState } from "react";
import { SearchIcon, ShareIcon } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStore } from "../Context/StoreContext";
import SearchBar from "./SearchBar";
import StoreInfo from "./StoreInfo";
import ShareButton from "./ShareButton";

const HeaderPublic = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentStore } = useStore();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const { storeInfo } = useStore();
    const logoUrl = storeInfo?.imagemUrl;
    const handleStoreClick = () => {
        if (!currentStore) return;
        const storePath = `/loja/${encodeURIComponent(currentStore)}`;
        if (location.pathname !== storePath) {
            navigate(storePath, { state: { storeName: currentStore } });
        }
    };
    return (
        <div className="w-full pb-13">
            <header className="fixed top-0 w-full z-50 bg-blue-500 h-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                        <div className="flex items-center space-x-3 cursor-pointer" onClick={handleStoreClick}>
                            <div className="w-10 h-10 bg-white rounded-full overflow-hidden">
                            <img
                                src={logoUrl || "/api/placeholder/32/32"}
                                alt="Logo da loja"
                                className="w-full h-full object-cover"
                                />
                            </div>
                            <h1 className="text-xl font-bold text-white">{currentStore || "Loja nao encontrada"}</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button onClick={() => setIsSearchOpen(!isSearchOpen)} className="p-2 hover:bg-blue-600 rounded-full">
                                <SearchIcon className="w-5 h-5 text-white" />
                            </button>
                            <ShareButton currentStore={currentStore} />
                        </div>
                    </div>
                </div>
                {isSearchOpen && <SearchBar />}
            </header>
            <StoreInfo />
        </div>
    );
};

export default HeaderPublic;
