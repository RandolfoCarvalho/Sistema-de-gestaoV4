import { Store } from 'lucide-react';

const SidebarHeader = () => (
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
);

export default SidebarHeader;