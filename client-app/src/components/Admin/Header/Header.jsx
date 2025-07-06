import React from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { MdSpaceDashboard } from "react-icons/md";
import { useStore } from '../../Context/StoreContext';

const Header = ({ toggleSidebar, darkMode, toggleDarkMode }) => {
    const { currentStore } = useStore();

    const handleStoreClick = () => {
        if (!currentStore) return;
        const storePath = `/loja/${encodeURIComponent(currentStore)}`;
        window.open(storePath, "_blank");
    };

    return (
        <header className="fixed top-0 z-50 w-full bg-white dark:bg-gray-800 shadow-md transition-colors duration-300">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6">
                <div className="flex items-center gap-4"> 
                    <button
                        onClick={toggleSidebar}
                        title="Abrir/Fechar menu"
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                    >
                        <HiOutlineMenuAlt2 className="w-6 h-6" />
                    </button>
                    <div
                        onClick={handleStoreClick}
                        title={`Abrir loja '${currentStore}' em nova aba`}
                        className="group flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                        <MdSpaceDashboard className="w-6 h-6 text-violet-500 transition-transform duration-300 group-hover:scale-110" />
                        <span className="text-lg font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                            {currentStore || "Gestão"}
                        </span>
                    </div>
                </div>
                <div className="flex items-center">
                    <button
                        onClick={toggleDarkMode}
                        title="Alterar tema"
                        className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 dark:focus:ring-offset-gray-800 transition-all duration-200"
                    >
                        {darkMode ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;