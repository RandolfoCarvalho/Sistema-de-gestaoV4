import { useState } from "react";
import { Home, ShoppingBag, Tag, ShoppingCart } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FinalUserModal from "@/components/Modals/FinalUserModal"; 
import { useStore } from '@/components/Context/StoreContext';

const BottomNav = () => {
    const { currentStore } = useStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    const handlePedidosClick = () => {
        const isAuthenticated = localStorage.getItem("isAuthenticated");
        if (!isAuthenticated) {
            setIsModalOpen(true);
        } else {
            navigate("/pedidos");
        }
    };

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-lg py-3 flex justify-around items-center">
            <Link to={`/loja/${currentStore}`} className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition">
                <Home className="w-6 h-6" />
                <span className="text-xs">Início</span>
            </Link>
            <div
                onClick={handlePedidosClick}
                className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition cursor-pointer"
            >
                <ShoppingBag className="w-6 h-6" />
                <span className="text-xs">Pedidos</span>
            </div>
            <Link to="/promo" className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition">
                <Tag className="w-6 h-6" />
                <span className="text-xs">Promo</span>
            </Link>
            <Link to="/checkout" className="flex flex-col items-center text-gray-500 hover:text-blue-600 transition">
                <ShoppingCart className="w-6 h-6" />
                <span className="text-xs">Carrinho</span>
            </Link>

            {/* Modal de login */}
            <FinalUserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    setIsModalOpen(false); 
                    navigate("/pedidos");
                }}
            />
        </div>
    );
};

export default BottomNav;
