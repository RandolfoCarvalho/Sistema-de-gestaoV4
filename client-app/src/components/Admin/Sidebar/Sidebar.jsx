import { links } from "../Constants";
import LinkItem from "./LinkItem";
import { Store, Clock3 } from "lucide-react";

const Sidebar = ({ isSidebarOpen }) => {
    return (
        <aside
            className={`
                fixed top-0 left-0 z-40 w-64 h-screen
                bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900
                border-r border-gray-200 dark:border-gray-700
                pt-20 pb-4
                transition-transform duration-300 ease-in-out
                ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
            `}
        >
            <div className="h-full overflow-y-auto overflow-x-hidden px-4">
                <div className="mb-6 px-2">
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
                        <div className="flex items-center">
                            <Store className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            <span className="ml-2 text-sm font-medium text-blue-700 dark:text-blue-300">Loja Online</span>
                        </div>
                        <div className="flex items-center bg-green-100 dark:bg-green-900/40 py-1 px-2 rounded-full">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-1.5"></div>
                            <span className="text-xs font-medium text-green-700 dark:text-green-400">Ativo</span>
                        </div>
                    </div>
                </div>
                
                <nav className="space-y-1">
                    <ul>
                        {links.map((link, index) => (
                            <LinkItem key={index} {...link} />
                        ))}
                    </ul>
                </nav>
                
                <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between px-2 mb-4">
                        <div className="flex items-center">
                            <Clock3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            <span className="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">Última atualização</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Hoje, 13:45</span>
                    </div>
                    
                    <div className="flex items-center mb-4 px-2">
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                                <span className="text-xs font-medium text-white">MP</span>
                            </div>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">Meu Perfil</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Ver configurações</p>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;