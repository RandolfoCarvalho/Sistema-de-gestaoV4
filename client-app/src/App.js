import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import axios from 'axios';
import Modal from 'react-modal';

// Context Providers
import { CartProvider } from './components/Context/CartContext';
import { SignalRProvider } from './services/SignalRContext';
import { StoreProvider } from './components/Context/StoreContext';
import { AuthProvider } from "./services/AuthContext";

// Global Styles
import './App.css';
import './index.css';

// Customer-facing
import Produtos from './components/Produtos/Produtos';
import ProductDetails from './components/ProdutoDetails/ProductDetails';
import CheckoutPage from './components/Checkout/Checkout';
import Autenticacao from './components/Authentication/Login';
import Pedidos from "./components/Pedidos/Pedidos";
import Promocoes from "./components/Promocoes/Promocoes";
import PedidosDetalhes from "./components/Pedidos/PedidosDetalhes";
import PerfilLoja from "./components/Perfil/PerfilLoja";

// Admin Layout & Protected Route
import AdminLayout from './components/Admin/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Admin Pages (sub-rotas)
import RestaurantDashboard from './components/Admin/Dashboard/OrderDashboard';
import Create from './components/Admin/Stats/CreateProduct';
import CriarGrupoAdicionais from './components/Admin/Stats/CreateAddGroup';
import CriarComplemento from './components/Admin/Stats/CreateComplement';
import MeusProdutos from './components/Admin/Stats/Products';
import Perfil from './components/Admin/Stats/Perfil';
import WhatsappBOT from './components/Admin/Stats/WhatsappBOT/whatsappBOT';
import Sair from './components/Admin/Stats/logout';

axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
Modal.setAppElement('#root'); 

const App = () => {
    const [darkMode, setDarkMode] = useState(false);
    const toggleDarkMode = () => setDarkMode(!darkMode);

    return (
        // AuthProvider deve envolver toda a aplicação ou as rotas que precisam de autenticação
        <AuthProvider>
            <SignalRProvider>
                <StoreProvider>
                    <CartProvider>
                        <Router>
                            <div className={darkMode ? "dark" : ""}>
                                <Routes>
                                    {/* Rotas públicas */}
                                    <Route path="/" element={<Produtos />} />
                                    <Route path="/loja/:nomeDaLoja" element={<Produtos />} />
                                    <Route path="/product/:id" element={<ProductDetails />} />
                                    <Route path="/checkout" element={<CheckoutPage />} />
                                    <Route path="/auth/login" element={<Autenticacao />} />
                                    <Route path="/pedidos" element={<Pedidos />} />
                                    <Route path="/pedidos/:numeroPedido" element={<PedidosDetalhes />} />
                                    <Route path="/promo" element={<Promocoes />} />
                                    <Route path='/loja/:nomeDaLoja/perfil' element={<PerfilLoja />} />
                                    
                                    {/* Rotas de Admin Protegidas */}
                                    {/* O ProtectedRoute é o pai que verifica a autenticação */}
                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/admin" element={
                                            <AdminLayout 
                                                darkMode={darkMode} 
                                                toggleDarkMode={toggleDarkMode} 
                                            />
                                        }>
                                            {/* Sub-rotas do Admin */}
                                            <Route index element={<RestaurantDashboard />} /> {/* /admin */}
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
        </AuthProvider>
    );
};

export default App;