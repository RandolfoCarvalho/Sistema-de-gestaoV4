import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';

// Context Providers
import { UserProvider } from './UserContext';
import { CartProvider } from './components/Carrinho/CartContext';
import { SignalRProvider } from './services/SignalRContext';
import { StoreProvider } from './components/Context/StoreContext';

// Global Styles
import './App.css';
import './index.css';

// Components
import Produtos from './components/Produtos/Produtos';
import ProductDetails from './components/ProdutoDetails/ProductDetails';
import Header from './components/HeaderPublic/HeaderPublic';
import CheckoutPage from './components/Checkout/Checkout';
import Autenticacao from './components/Authentication/Login';

import BottomNav from "./components/BottomNav";
import Pedidos from "./components/Pedidos/Pedidos";
import PedidosDetalhes from "./components/Pedidos/PedidosDetalhes";


// Admin Components
import Sidebar from './components/Admin/Sidebar/Sidebar';
import HeaderAdmin from './components/Admin/Header/Header';
import Main from './components/Admin/ui/Main';
import Content from './components/Admin/ui/Content';
//import RestaurantDashboard from './components/Admin/Stats/RestaurantDashboard';
import RestaurantDashboard from './components/Admin/Dashboard/OrderDashboard';
import Create from './components/Admin/Stats/CreateProduct';
import CriarGrupoAdicionais from './components/Admin/Stats/CreateAddGroup';
import CriarComplemento from './components/Admin/Stats/CreateComplement';
import MeusProdutos from './components/Admin/Stats/Products';
import Perfil from './components/Admin/Stats/Perfil';
import Sair from './components/Admin/Stats/logout';

//protecao da rota admin
import ProtectedRoute from './components/ProtectedRoute';

// Axios Global Config
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
Modal.setAppElement('#root');

// Layout Components
const AdminLayout = ({ children }) => (
    <>
        <Header />
        {children}
    </>
);

// Private Route Component
const PrivateRoute = ({ element: Element }) => {
    const isAuthenticated = () => localStorage.getItem('token') !== null;
    return isAuthenticated() ? (
        <AdminLayout>
            <Element />
        </AdminLayout>
    ) : (
        <Navigate to="/auth/login" replace />
    );
};

const App = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleDarkMode = () => setDarkMode(!darkMode);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    return (
        <SignalRProvider>
            <StoreProvider>
                <UserProvider>
                    <CartProvider>

                        <Router>
                            <div className={darkMode ? "dark" : ""}>
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/" element={<Produtos />} />
                                    <Route path="/loja/:nomeDaLoja" element={<Produtos />} />
                                    <Route path="/product/:id" element={<ProductDetails />} />
                                    <Route path="/checkout" element={<CheckoutPage />} />
                                    <Route path="/auth/login" element={<Autenticacao />} />
                                    <Route path="/pedidos" element={<Pedidos />} />
                                    <Route path="/pedidos/:numeroPedido" element={<PedidosDetalhes />} />
                                    <Route path="/promo" element={<div>P�gina de Promo��es</div>} />
                                    <Route path="/carrinho" element={<div>P�gina do Carrinho</div>} />
                                    {/* Admin Routes */}
                                    <Route element={<ProtectedRoute redirectTo="/auth/login" />}>
                                        <Route path="/admin" element={
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
                                                            <Outlet />
                                                        </Content>
                                                    </Main>
                                                </div>
                                            </div>
                                        }>
                                            <Route index element={<RestaurantDashboard />} />
                                            <Route path="dashboard" element={<RestaurantDashboard />} />
                                            <Route path="CriarProduto" element={<Create />} />
                                            <Route path="CriarGrupoAdicionais" element={<CriarGrupoAdicionais />} />
                                            <Route path="CriarComplemento" element={<CriarComplemento />} />
                                            <Route path="MeusProdutos" element={<MeusProdutos />} />
                                            <Route path="Perfil" element={<Perfil />} />
                                            <Route path="Sair" element={<Sair />} />
                                        </Route>
                                    </Route>
                                </Routes>
                            </div>
                        </Router>
                    </CartProvider>
                </UserProvider>
            </StoreProvider>
        </SignalRProvider>
    );
};

export default App;