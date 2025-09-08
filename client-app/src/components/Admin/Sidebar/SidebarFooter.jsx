import React, { useState, useEffect } from 'react';
import { Clock3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDisplayDateTime } from '../../../utils/dateUtils'; // Ajuste o caminho

const SidebarFooter = ({ logoUrl }) => {
    const navigate = useNavigate();
    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

    useEffect(() => {
        setLastUpdateTime(new Date());
    }, []);

    const handleProfileClick = () => {
        navigate('/admin/Perfil');
    };
    const handleProfileKeyPress = (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            handleProfileClick();
        }
    };

    return (
        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex items-center">
                    <Clock3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">Última atualização</span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDisplayDateTime(lastUpdateTime)}
                </span>
            </div>

            <div 
                className="flex items-center mb-4 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition"
                onClick={handleProfileClick}
                onKeyPress={handleProfileKeyPress}
                role="button"
                tabIndex={0}
                aria-label="Acessar perfil e configurações"
            >
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <img
                        src={logoUrl || 'path/to/default-placeholder.png'}
                        alt="Logo da loja"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Meu Perfil</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400 underline">Ver configurações</p>
                </div>
            </div>
        </div>
    );
};

export default SidebarFooter;