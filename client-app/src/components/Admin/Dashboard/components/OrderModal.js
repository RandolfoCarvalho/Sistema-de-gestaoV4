import React, { useState } from 'react';
import axios from 'axios';

const OrderModal = ({ order, onClose }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [motivoCancelamento, setMotivoCancelamento] = useState('');
    const [activeTab, setActiveTab] = useState('detalhes');
    
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };
    console.log("order.status: ", order.status)
    console.log("Pedido: ", JSON.stringify(order, null, 2));
    const handleCancelOrder = async () => {
        if (!motivoCancelamento.trim()) {
            setError('Por favor, informe o motivo do cancelamento.');
            return;
        }
        try {
            setLoading(true);
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/buscarTransactionId/${order.id}`);
            const pedido = res.data;
            const transactionId = pedido.pagamento?.transactionId || '';
            console.log("Pedidos: " + JSON.stringify(pedido, null, 2));
            // Reembolso
            const reembolsoResult = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/processaReembolso`, {
                transactionId: transactionId,
                Amount: order.valorTotal,
                RestauranteId: pedido.restauranteId,
            });
            // Cancelamento
            await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Pedido/registrarCancelamento`, {
                pedidoId: pedido.id,
                motivoCancelamento: motivoCancelamento,
                codigoReembolso: reembolsoResult.data.id || '',
                valorReembolsado: order.valorTotal,
                transacaoReembolsoId: transactionId,
                estaReembolsado: true,
                FinalUserId : pedido.finalUserId,
                FinalUserName: pedido.finalUserName,
            });
            // Notificação de sucesso
            setError('');
            setShowConfirm(false);
            const notificacao = document.createElement('div');
            notificacao.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg z-50';
            notificacao.textContent = 'Pedido cancelado e reembolsado com sucesso!';
            document.body.appendChild(notificacao);
    
            setTimeout(() => {
                notificacao.remove();
                onClose();
            }, 3000);
    
        } catch (err) {
            console.error(err);
            setError('Erro ao cancelar e reembolsar o pedido. Tente novamente mais tarde.');
        } finally {
            setLoading(false);
        }
    };
    // Status do pedido com cores correspondentes
    const getStatusColor = (status) => {
        const statusColors = {
            'Pendente': 'bg-yellow-100 text-yellow-800',
            'Confirmado': 'bg-blue-100 text-blue-800',
            'Em Preparação': 'bg-purple-100 text-purple-800',
            'Em Entrega': 'bg-indigo-100 text-indigo-800',
            'Entregue': 'bg-green-100 text-green-800',
            'Cancelado': 'bg-red-100 text-red-800'
        };
        
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-xl font-semibold">Pedido #{order.id}</h2>
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                        </span>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                {/* Tabs */}
                <div className="flex border-b">
                    <button 
                        className={`px-4 py-2 font-medium ${activeTab === 'detalhes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                        onClick={() => setActiveTab('detalhes')}
                    >
                        Detalhes
                    </button>
                    <button 
                        className={`px-4 py-2 font-medium ${activeTab === 'cliente' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                        onClick={() => setActiveTab('cliente')}
                    >
                        Cliente
                    </button>
                    <button 
                        className={`px-4 py-2 font-medium ${activeTab === 'entrega' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                        onClick={() => setActiveTab('entrega')}
                    >
                        Entrega
                    </button>
                    <button 
                        className={`px-4 py-2 font-medium ${activeTab === 'pagamento' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
                        onClick={() => setActiveTab('pagamento')}
                    >
                        Pagamento
                    </button>
                </div>
                {/* Conteúdo da Tab */}
                <div className="p-4 overflow-y-auto flex-grow">
                    {activeTab === 'detalhes' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-gray-500">Data: {new Date(order.dataPedido).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                                <p className="font-medium text-lg">{formatCurrency(order.valorTotal)}</p>
                            </div>
                            
                            <h3 className="font-semibold mb-2 text-gray-800">Itens do Pedido</h3>
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                {order.itens.map((item) => (
                                    <div key={item.id} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                                        <div className="flex-1">
                                            <p className="font-medium">{item.produto?.nome}</p>
                                            {item.observacao && <p className="text-sm text-gray-500">Obs: {item.observacao}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p>{item.quantidade} x {formatCurrency(item.precoUnitario)}</p>
                                            <p className="font-medium">{formatCurrency(item.quantidade * item.precoUnitario)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-3 font-semibold">
                                    <p>Total</p>
                                    <p>{formatCurrency(order.valorTotal)}</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'cliente' && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 text-gray-800">Informações do Cliente</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Nome</p>
                                        <p className="font-medium">{order.finalUser?.nome || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Email</p>
                                        <p className="font-medium">{order.finalUser?.email || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Telefone</p>
                                        <p className="font-medium">{order.finalUser?.telefone || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">ID do Usuário</p>
                                        <p className="font-medium">{order.finalUser?.id || 'Não informado'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'entrega' && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 text-gray-800">Endereço de Entrega</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Rua</p>
                                        <p className="font-medium">{order.enderecoEntrega?.rua || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Número</p>
                                        <p className="font-medium">{order.enderecoEntrega?.numero || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Complemento</p>
                                        <p className="font-medium">{order.enderecoEntrega?.complemento || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Bairro</p>
                                        <p className="font-medium">{order.enderecoEntrega?.bairro || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Cidade</p>
                                        <p className="font-medium">{order.enderecoEntrega?.cidade || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">CEP</p>
                                        <p className="font-medium">{order.enderecoEntrega?.cep || 'Não informado'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {activeTab === 'pagamento' && (
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-2 text-gray-800">Detalhes do Pagamento</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Forma de Pagamento</p>
                                        <p className="font-medium">{order.pagamento?.formaPagamento || 'Não informado'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Status</p>
                                        <div className="mt-1">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                order.pagamento?.status === 'Aprovado' ? 'bg-green-100 text-green-800' : 
                                                order.pagamento?.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' : 
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {order.pagamento?.status || 'Não informado'}
                                            </span>
                                        </div>
                                    </div>
                                    {order.pagamento?.transactionId && (
                                        <div>
                                            <p className="text-sm text-gray-500">ID da Transação</p>
                                            <p className="font-medium font-mono text-sm">{order.pagamento.transactionId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                {/* Footer com ações */}
                <div className="p-4 border-t bg-gray-50 rounded-b-lg flex justify-end gap-3">
                    <button
                        onClick={() => alert("Imprimindo nota fiscal...")}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Imprimir NF
                    </button>
                    {order.status !== 'cancelado' && (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 flex items-center"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancelar Pedido
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Fechar
                    </button>
                </div>
                {/* Modal de confirmação de cancelamento */}
                {showConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full animate-fadeIn">
                            <div className="mb-4 flex items-center text-red-600">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h3 className="text-lg font-semibold">Cancelar e Reembolsar Pedido</h3>
                            </div>
                            
                            <p className="mb-4 text-gray-600">Este pedido será cancelado e o valor de {formatCurrency(order.valorTotal)} será reembolsado ao cliente. Esta ação não pode ser desfeita.</p>
                            
                            <div className="mb-4">
                                <label className="block text-sm font-medium mb-1 text-gray-700">
                                    Motivo do Cancelamento:
                                </label>
                                <textarea 
                                    value={motivoCancelamento}
                                    onChange={(e) => setMotivoCancelamento(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                    placeholder="Informe o motivo do cancelamento"
                                />
                            </div>
                            
                            {error && (
                                <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-700">
                                    <p className="text-sm">{error}</p>
                                </div>
                            )}
                            
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => {
                                        setShowConfirm(false);
                                        setError('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                                    disabled={loading}
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleCancelOrder}
                                    disabled={loading}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Processando...
                                        </>
                                    ) : (
                                        'Confirmar Cancelamento'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderModal;