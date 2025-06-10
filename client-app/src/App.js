import React, { useState, useEffect } from 'react'; // Adicionado useEffect aqui
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
import Pedidos from "./components/Pedidos/Pedidos";
import Promocoes from "./components/Promocoes/Promocoes";
import PedidosDetalhes from "./components/Pedidos/PedidosDetalhes";

// Admin Components
import Sidebar from './components/Admin/Sidebar/Sidebar';
import HeaderAdmin from './components/Admin/Header/Header';
import Main from './components/Admin/ui/Main';
import Content from './components/Admin/ui/Content';
import RestaurantDashboard from './components/Admin/Dashboard/OrderDashboard';
import Create from './components/Admin/Stats/CreateProduct';
import CriarGrupoAdicionais from './components/Admin/Stats/CreateAddGroup';
import CriarComplemento from './components/Admin/Stats/CreateComplement';
import MeusProdutos from './components/Admin/Stats/Products';
import Perfil from './components/Admin/Stats/Perfil';
import WhatsappBOT from './components/Admin/Stats/WhatsappBOT/whatsappBOT';
import Sair from './components/Admin/Stats/logout';
import PaginaDeCarregamento from './components/ui/FuturisticLoadingSpinner';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from "./services/AuthContext";
import ProtectedStore from './components/ProtectedStore';


// Axios Global Config
axios.defaults.headers.common['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
Modal.setAppElement('#root');

// ==========================================================
// NOVO: Componente para lidar com a Rota Principal ("/")
// ==========================================================
const RoteadorPrincipal = () => {
  const [lojaDeterminada, setLojaDeterminada] = useState(null);
  const [verificando, setVerificando] = useState(true);

  useEffect(() => {
    // Este hook roda apenas uma vez quando o componente é montado
    const lojaSalva = localStorage.getItem('fomedique_current_store');
    if (lojaSalva) {
      setLojaDeterminada(lojaSalva);
    }
    // Independente de encontrar ou não, a verificação terminou
    setVerificando(false);
  }, []); // O array vazio [] garante que rode só uma vez

  if (verificando) {
    // Enquanto estamos verificando o localStorage, mostre uma tela de carregamento
    return <PaginaDeCarregamento />;
  }

  if (lojaDeterminada) {
    // Se encontramos uma loja salva, redireciona o usuário para a página daquela loja
    // O usuário não verá a URL mudar, pois o React Router faz isso internamente.
    return <Navigate to={`/loja/${lojaDeterminada}`} replace />;
  } else {
    // Se não há loja salva, o usuário provavelmente acessou app.fomedique.com.br diretamente.
    // O melhor a fazer é levá-lo para a página de login/autenticação.
    return <Navigate to="/auth/login" replace />;
  }
};


const App = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleDarkMode = () => setDarkMode(!darkMode);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    
    // O bloco de lógica que você tinha aqui foi movido para o componente RoteadorPrincipal

    return (
        <SignalRProvider>
            <StoreProvider>
                <UserProvider>
                    <CartProvider>
                    <AuthProvider>
                        <Router>
                            <div className={darkMode ? "dark" : ""}>
                                <Routes>
                                    {/* MODIFICADO: A rota principal agora usa nosso novo componente inteligente */}
                                    <Route path="/" element={<RoteadorPrincipal />} />

                                    {/* O restante das suas rotas continua igual */}
                                    <Route element={<ProtectedStore/>}>
                                        <Route path="/loja/:nomeDaLoja" element={<Produtos />} />
                                        <Route path="/product/:id" element={<ProductDetails />} />
                                        <Route path="/checkout" element={<CheckoutPage />} />
                                        <Route path="/auth/login" element={<Autenticacao />} />
                                        <Route path="/pedidos" element={<Pedidos />} />
                                        <Route path="/pedidos/:numeroPedido" element={<PedidosDetalhes />} />
                                        <Route path="/promo" element={<Promocoes />} />
                                    </Route>
                                    
                                    {/* Admin Routes */}
                                    <Route element={<ProtectedRoute/>}>
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
                                            <Route path="WhatsappBOT" element={<WhatsappBOT />} />
                                            <Route path="Sair" element={<Sair />} />
                                        </Route>
                                    </Route>
                                </Routes>
                            </div>
                        </Router>
                        </AuthProvider>
                    </CartProvider>
                </UserProvider>
            </StoreProvider>
        </SignalRProvider>
    );
};

export default App;