import { useStore } from '../../Context/StoreContext'; 

// Importando os subcomponentes
import SidebarHeader from './SidebarHeader';
import NavigationLinks from './NavigationLinks';
import SidebarFooter from './SidebarFooter';

const BASE_SIDEBAR_CLASSES = `
    fixed top-0 left-0 z-40 w-64 h-screen
    bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900
    border-r border-gray-200 dark:border-gray-700
    pt-20 pb-4 
    transition-transform duration-300 ease-in-out
`;

const Sidebar = ({ isSidebarOpen }) => {
    const { storeInfo } = useStore();
    const logoUrl = storeInfo?.imagemUrl;

    const sidebarVisibilityClass = isSidebarOpen ? "translate-x-0" : "-translate-x-full";

    return (
        <aside 
            className={`${BASE_SIDEBAR_CLASSES} ${sidebarVisibilityClass}`}
            aria-label="Menu lateral principal"
        >
            <div className="h-full overflow-y-auto overflow-x-hidden px-4 flex flex-col">
                <SidebarHeader />
                <NavigationLinks />
                <SidebarFooter logoUrl={logoUrl} />
            </div>
        </aside>
    );
};

export default Sidebar;