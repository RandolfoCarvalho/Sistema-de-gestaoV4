import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Outlet } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';

// Context Providers
import { CartProvider } from './components/Context/CartContext';
import { SignalRProvider } from './services/SignalRContext';
import { StoreProvider } from './components/Context/StoreContext';

// Global Styles
import './App.css';
import './index.css';

// Components
import Produtos from './components/Produtos/Produtos';
import ProductDetails from './components/ProdutoDetails/ProductDetails';
import CheckoutPage from './components/Checkout/Checkout';
import Autenticacao from './components/Authentication/Login';
import Pedidos from "./components/Pedidos/Pedidos";
import Promocoes from "./components/Promocoes/Promocoes";
import PedidosDetalhes from "./components/Pedidos/PedidosDetalhes";
import PerfilLoja from "./components/Perfil/PerfilLoja";

// Admin Components
import Sidebar from './components/Admin/Sidebar/Sidebar';
import HeaderAdmin from './components/Admin/Header/Header';
//import RestaurantDashboard from './components/Admin/Stats/RestaurantDashboard';
import RestaurantDashboard from './components/Admin/Dashboard/OrderDashboard';
import Create from './components/Admin/Stats/CreateProduct';
import CriarGrupoAdicionais from './components/Admin/Stats/CreateAddGroup';
import CriarComplemento from './components/Admin/Stats/CreateComplement';
import MeusProdutos from './components/Admin/Stats/Products';
import Perfil from './components/Admin/Stats/Perfil';
import WhatsappBOT from './components/Admin/Stats/WhatsappBOT/whatsappBOT';
import Sair from './components/Admin/Stats/logout';
//protecao da rota admin
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from "./services/AuthContext";

// Axios Global Config
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
Modal.setAppElement('#root');

const AdminLayout = () => {
  return (
    // 1. O Provedor envolve tudo que precisa do contexto de autenticação do admin.
    <AuthProvider>
      {/* 2. O ProtectedRoute verifica se o usuário pode acessar e renderiza o <Outlet /> */}
      <ProtectedRoute />
    </AuthProvider>
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
                    <CartProvider>
                        <Router>
                            <div className={darkMode ? "dark" : ""}>
                                <Routes>
                                 <Route path="/" element={<Produtos />} />
                                    <Route path="/loja/:nomeDaLoja" element={<Produtos />} />
                                    <Route path="/product/:id" element={<ProductDetails />} />
                                    <Route path="/checkout" element={<CheckoutPage />} />
                                    <Route path="/auth/login" element={<Autenticacao />} />
                                    <Route path="/pedidos" element={<Pedidos />} />
                                    <Route path="/pedidos/:numeroPedido" element={<PedidosDetalhes />} />
                                    <Route path="/promo" element={<Promocoes />} />
                                    <Route path='/loja/:nomeDaLoja/perfil' element={<PerfilLoja />} />
                                    {/* Admin Routes */}
                                    <Route element={<AdminLayout />}>
                                        <Route path="/admin" element={
                                            <div className={`${darkMode ? 'dark' : ''} flex bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400`}>
                                                <Sidebar isSidebarOpen={isSidebarOpen} />
                                                
                                                {/* AQUI ESTÁ A CORREÇÃO. Adicione 'min-w-0' a este div. */}
                                                <div className={`flex-1 min-h-screen min-w-0 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"}`}>
                                                    <HeaderAdmin
                                                        isSidebarOpen={isSidebarOpen}
                                                        toggleSidebar={toggleSidebar}
                                                        darkMode={darkMode}
                                                        toggleDarkMode={toggleDarkMode}
                                                    />
                                                    <main className="p-4 h-[calc(100vh-theme(height.16))] overflow-y-auto" style={{ paddingTop: '55px' }}>
                                                        {/* O Outlet renderiza seu dashboard aqui dentro */}
                                                        <Outlet /> 
                                                    </main>
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
                                            <Route path="WhatsappBOT" element={<WhatsappBOT />} />
                                            <Route path="Sair" element={<Sair />} />
                                        </Route>
                                    </Route>
                                </Routes>
                            </div>
                        </Router>
                    </CartProvider>
            </StoreProvider>
        </SignalRProvider>
    );
};

export default App;