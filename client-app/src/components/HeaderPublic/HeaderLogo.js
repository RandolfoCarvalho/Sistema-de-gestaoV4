import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeaderLogo = ({ storeName, fantasyName, logoUrl }) => {
    const navigate = useNavigate();
    const handleStoreClick = () => navigate(`/loja/${encodeURIComponent(storeName)}`);

    return (
        <div
            onClick={handleStoreClick}
            className="flex items-center space-x-3 cursor-pointer"
        >
            <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                <img src={logoUrl || "/api/placeholder/40/40"} alt="Logo da loja" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-lg font-bold text-white hidden sm:block truncate">{fantasyName || "Loja"}</h1>
        </div>
    );
};

export default HeaderLogo;