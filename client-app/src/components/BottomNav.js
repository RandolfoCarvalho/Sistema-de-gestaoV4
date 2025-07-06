import { useState } from "react";
import { Home, ShoppingBag, Tag, ShoppingCart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import FinalUserModal from "./Modals/FinalUserModal";
import { useStore } from './Context/StoreContext';
import { useCart } from "./Context/CartContext";
import axios from "axios";
import Swal from 'sweetalert2';

const BottomNav = () => {
    const { currentStore } = useStore();
    const { cart } = useCart();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleProtectedLinkClick = (path) => {
        const userId = localStorage.getItem("userId");
        const userName = localStorage.getItem("FinalUserName");
        const userPhone = localStorage.getItem("FinalUserTelefone");

        if (userId && userName && userPhone) {
            navigate(path);
        } else {
            setIsModalOpen(true);
        }
    };

    const handleLoginSuccess = (userDataWithToken) => {
        const { id, nome, telefone, token } = userDataWithToken;
        localStorage.setItem("userId", id);
        localStorage.setItem("FinalUserName", nome);
        localStorage.setItem("FinalUserTelefone", telefone);
        localStorage.setItem("jwtToken", token);

        setIsModalOpen(false);
        navigate("/pedidos");
    };

    return (
        <>
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg py-3 flex justify-around items-center z-40">
                <Link to={`/loja/${currentStore}`} className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    <Home className="w-6 h-6" />
                    <span className="text-xs mt-1">Início</span>
                </Link>
                <div onClick={() => handleProtectedLinkClick("/pedidos")} className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 cursor-pointer">
                    <ShoppingBag className="w-6 h-6" />
                    <span className="text-xs mt-1">Pedidos</span>
                </div>
                <Link to="/promo" className="flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    <Tag className="w-6 h-6" />
                    <span className="text-xs mt-1">Promoções</span>
                </Link>
                <Link to="/checkout" className="relative flex flex-col items-center text-gray-600 hover:text-blue-600 transition-colors duration-200">
                    <ShoppingCart className="w-6 h-6" />
                    {cart.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {cart.length}
                        </span>
                    )}
                    <span className="text-xs mt-1">Carrinho</span>
                </Link>
            </div>
            <FinalUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleLoginSuccess}
            />
        </>
    );
};

export default BottomNav;