// src/components/Admin/AdminLayout.js
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar/Sidebar'; 
import HeaderAdmin from './Header/Header'; 

const AdminLayout = ({ darkMode, toggleDarkMode }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className={`${darkMode ? 'dark' : ''} flex bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400`}>
            <Sidebar isSidebarOpen={isSidebarOpen} />
            
            <div className={`flex-1 min-h-screen min-w-0 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                <HeaderAdmin
                    isSidebarOpen={isSidebarOpen}
                    toggleSidebar={toggleSidebar}
                    darkMode={darkMode}
                    toggleDarkMode={toggleDarkMode}
                />
                <main className="p-4 h-[calc(100vh-theme(height.16))] overflow-y-auto" style={{ paddingTop: '55px' }}>
                    <Outlet /> 
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;