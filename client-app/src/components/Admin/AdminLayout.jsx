import { Outlet } from 'react-router-dom';

const AdminLayout = ({ darkMode, toggleDarkMode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className={`${darkMode ? 'dark' : ''} flex bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400`}>
            <Sidebar isSidebarOpen={isSidebarOpen} />
            <div className={`flex-1 min-h-screen transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                <HeaderAdmin
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                />
                <Main className="p-4">
                    <Content>
                        <Outlet /> {/* Este é onde as subrotas serão renderizadas */}
                    </Content>
                </Main>
            </div>
        </div>
    );
};