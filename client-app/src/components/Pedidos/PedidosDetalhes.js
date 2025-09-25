import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '../Context/StoreContext';
import axios from "axios";
import {
    PackageCheck, ChefHat, Bike, PartyPopper, Wallet, User,
    MapPin, Hash, RefreshCw, ShoppingCart, XCircle, Store
} from 'lucide-react';
import BottomNav from '../BottomNav';

// --- Funções Helper ---
const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateString) => {
    if (!dateString) return { date: "N/A", time: "N/A" };
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
        time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
};

// --- Componentes de UI de Alta Qualidade ---
const STATUS_CANCELADO = 4;
const StatusTracker = ({ status, orderDate, tipoEntrega }) => {
    const statusSteps = useMemo(() => {
        if (tipoEntrega === 'RETIRADA') {
            return [
                { name: "Recebido", icon: PackageCheck },
                { name: "Em Preparo", icon: ChefHat },
                { name: "Pronto p/ Retirada", icon: Store },
                { name: "Retirado", icon: PartyPopper }
            ];
        }
        // Padrão para DELIVERY
        return [
            { name: "Recebido", icon: PackageCheck },
            { name: "Em Preparo", icon: ChefHat },
            { name: "Saiu para Entrega", icon: Bike },
            { name: "Entregue", icon: PartyPopper }
        ];
    }, [tipoEntrega]);

    const currentStatusIndex = status > 4 ? 4 : status;

    if (status === STATUS_CANCELADO) {
        return (
            <div className="bg-red-50 p-5 rounded-xl shadow-sm border border-red-200">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-lg font-bold text-red-800">Status do Pedido</h2>
                    <span className="text-sm font-medium text-red-600">{formatDate(orderDate).date}</span>
                </div>
                <div className="flex items-center justify-center text-center">
                     <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-600 text-white">
                            <XCircle size={24} />
                        </div>
                        <p className="mt-2 text-base font-bold text-red-700">Pedido Cancelado</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-5 rounded-xl shadow-sm">
            <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-gray-800">Acompanhe seu Pedido</h2>
                <span className="text-sm font-medium text-gray-500">{formatDate(orderDate).date}</span>
            </div>
            <div className="flex items-center">
                {statusSteps.map((step, index) => {
                    const isCompleted = index < currentStatusIndex;
                    const isActive = index === currentStatusIndex;
                    return (
                        <React.Fragment key={step.name}>
                            <div className="flex flex-col items-center text-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                                    isActive ? 'bg-blue-600 text-white ring-4 ring-blue-200' :
                                    isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                                }`}>
                                    <step.icon size={20} />
                                </div>
                                <p className={`mt-2 text-xs font-semibold transition-colors ${
                                    isActive || isCompleted ? 'text-blue-700' : 'text-gray-500'
                                }`}>{step.name}</p>
                            </div>
                            {index < statusSteps.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 transition-colors ${
                                    isCompleted ? 'bg-blue-600' : 'bg-gray-200'
                                }`}></div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

const OrderItemCard = ({ item }) => (
    <div className="flex items-start space-x-4 py-4">
        <img
            src={item.imageUrl || `https://ui-avatars.com/api/?name=${item.nomeProduto}&background=f3f4f6&color=6b7280&size=128&bold=true`}
            alt={item.nomeProduto}
            className="w-16 h-16 rounded-lg object-cover border border-gray-100"
        />
        <div className="flex-1">
            <div className="flex justify-between">
                <h4 className="font-semibold text-gray-800 pr-2">{item.quantidade}x {item.nomeProduto}</h4>
                <p className="font-semibold text-gray-800">{formatCurrency(item.precoUnitario)}</p>
            </div>
            {item.opcoesExtras && item.opcoesExtras.length > 0 && (
                <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-600 space-y-1">
                    {item.opcoesExtras.map((extra, idx) => (
                        <div key={idx} className="flex justify-between">
                           <span>+ {extra.quantidade}x {extra.nome}</span>
                           {extra.precoUnitario > 0 && <span>{formatCurrency(extra.precoUnitario)}</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    </div>
);

const InfoBlock = ({ icon, title, children }) => (
    <div className="bg-white p-4 rounded-xl shadow-sm flex items-start space-x-4">
        <div className="text-blue-600 mt-1">{icon}</div>
        <div>
            <h3 className="text-sm font-semibold text-gray-500 mb-1">{title}</h3>
            <div className="text-gray-800 font-medium text-sm space-y-1">{children}</div>
        </div>
    </div>
);

// --- COMPONENTE PRINCIPAL (Orquestrador) ---
const OrderDetails = () => {
    const navigate = useNavigate();
    const { numeroPedido } = useParams();
    const location = useLocation();
    const [orderData, setOrderData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { currentStore, storeInfo } = useStore();
    const userPhone = localStorage.getItem("FinalUserTelefone");

    useEffect(() => {
        const fetchOrderDetails = async () => {
            if (location.state?.orderData) {
                setOrderData(location.state.orderData);
                setLoading(false);
                return;
            }
            try {
                const restauranteResponse = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/BuscarRestauranteIdPorNome/${currentStore}`);
                const restauranteId = restauranteResponse.data;
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/FinalUser/GetPedidosByUser/${userPhone}/${restauranteId}`);
                const order = response.data?.find(o => o.id.toString() === numeroPedido);
                setOrderData(order || null);
            } catch (error) {
                console.error("Erro ao buscar detalhes do pedido:", error);
                setOrderData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchOrderDetails();
    }, [numeroPedido, currentStore, userPhone, location.state]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Carregando detalhes...</div>;
    }

    if (!orderData) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 text-center">
                <h2 className="text-xl font-bold text-gray-700">Pedido Não Encontrado</h2>
                <p className="text-gray-500 mt-2 mb-6">Não foi possível carregar os detalhes deste pedido.</p>
                <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold">
                    Voltar
                </button>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="sticky top-0 bg-white shadow-sm p-4 flex items-center z-10">
                <button className="mr-3" onClick={() => navigate(-1)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                    </svg>
                </button>
                <h1 className="text-xl font-medium">Detalhes do pedido</h1>
            </div>
            <main className="flex-1 overflow-y-auto pb-28">
                <div className="max-w-4xl mx-auto p-4 space-y-6">
                    <StatusTracker status={orderData.status} orderDate={orderData.dataPedido} tipoEntrega={orderData.tipoEntrega} />
                    <div className="bg-white rounded-xl shadow-sm">
                        <div className="p-4 border-b border-gray-100 flex items-center space-x-3">
                            <ShoppingCart size={20} className="text-gray-500"/>
                            <h3 className="text-md font-semibold text-gray-800">Resumo da Compra</h3>
                        </div>
                        <div className="divide-y divide-gray-100 px-4">
                            {orderData.itens.map((item) => <OrderItemCard key={item.id || item.nomeProduto} item={item} />)}
                        </div>
                        <div className="p-4 bg-gray-50/50 rounded-b-xl space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-gray-600">Subtotal</span><span>{formatCurrency(orderData.pagamento.subTotal)}</span></div>
                            {orderData.tipoEntrega === 'DELIVERY' && (
                                <div className="flex justify-between"><span className="text-gray-600">Taxa de entrega</span><span>{formatCurrency(orderData.pagamento.taxaEntrega)}</span></div>
                            )}
                            {orderData.pagamento.desconto > 0 && (
                                <div className="flex justify-between text-green-600 font-medium"><span>Desconto</span><span>-{formatCurrency(orderData.pagamento.desconto)}</span></div>
                            )}
                            <div className="!mt-4 pt-3 border-t border-gray-200 flex justify-between font-bold text-base text-gray-900"><span>Total</span><span>{formatCurrency(orderData.pagamento.valorTotal)}</span></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InfoBlock icon={<Hash size={20} />} title="NÚMERO DO PEDIDO">
                            <p>#{orderData.numero}</p>
                        </InfoBlock>
                        <InfoBlock icon={<Wallet size={20} />} title="PAGAMENTO">
                            <p>{orderData.pagamento.formaPagamento}</p>
                            {orderData.observacoes && <p className="text-xs text-gray-500">Obs: "{orderData.observacoes}"</p>}
                        </InfoBlock>
                        {orderData.tipoEntrega === 'RETIRADA' ? (
                            <InfoBlock icon={<Store size={20} />} title="LOCAL DE RETIRADA">
                                <p>{storeInfo?.nome || 'Endereço da Loja'}</p>
                                <p>{storeInfo?.endereco || 'Consulte o endereço da loja.'}</p>
                            </InfoBlock>
                        ) : (
                            <InfoBlock icon={<MapPin size={20} />} title="ENDEREÇO DE ENTREGA">
                                {orderData.enderecoEntrega ? (
                                    <>
                                        <p>{orderData.enderecoEntrega.logradouro}, {orderData.enderecoEntrega.numero}</p>
                                        <p>{orderData.enderecoEntrega.bairro}, {orderData.enderecoEntrega.cidade}</p>
                                    </>
                                ) : <p>Endereço não disponível.</p>}
                            </InfoBlock>
                        )}
                        <InfoBlock icon={<User size={20} />} title="CLIENTE">
                            <p>{orderData.finalUserName}</p>
                            <p>{orderData.finalUserTelefone}</p>
                        </InfoBlock>
                    </div>

                    <div className="pt-4 flex justify-center">
                        <button
                            onClick={() => alert("Funcionalidade 'Repetir Pedido' a ser implementada.")}
                            className="flex items-center gap-2 bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-blue-200 transition-colors"
                        >
                            <RefreshCw size={16} />
                            Repetir Pedido
                        </button>
                    </div>
                </div>
            </main>
            <BottomNav />
        </div>
    );
};

export default OrderDetails;