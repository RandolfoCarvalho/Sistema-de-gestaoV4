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
    
    console.log("order.status: ", order.status);
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
            const transactionId = pedido.pagamento?.transactionId || order.pagamento?.transactionId || '';
            console.log("Pedidos: " + JSON.stringify(pedido, null, 2));
            // Reembolso
            const reembolsoResult = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/processaReembolso`, {
                transactionId: transactionId,
                Amount: order.pagamento?.valorTotal || 0,
                RestauranteId: pedido.restauranteId || order.restauranteId,
            });
            // Cancelamento
            await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Pedido/registrarCancelamento`, {
                pedidoId: pedido.id,
                motivoCancelamento: motivoCancelamento,
                codigoReembolso: reembolsoResult.data.id || '',
                valorReembolsado: order.pagamento?.valorTotal || 0,
                transacaoReembolsoId: transactionId,
                estaReembolsado: true,
                FinalUserId: pedido.finalUserId,
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
        const statusMap = {
            'NOVO': 'Pendente',
            'CONFIRMADO': 'Confirmado',
            'EM_PREPARACAO': 'Em Preparação',
            'EM_ENTREGA': 'Em Entrega',
            'ENTREGUE': 'Entregue',
            'CANCELADO': 'Cancelado'
        };
        
        const statusColors = {
            'Pendente': 'bg-yellow-100 text-yellow-800',
            'Confirmado': 'bg-blue-100 text-blue-800',
            'Em Preparação': 'bg-purple-100 text-purple-800',
            'Em Entrega': 'bg-indigo-100 text-indigo-800',
            'Entregue': 'bg-green-100 text-green-800',
            'Cancelado': 'bg-red-100 text-red-800',
            'NOVO': 'bg-yellow-100 text-yellow-800'
        };
        
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };
    
    // Função para formatar a data do pedido
    const formatDate = (dateString) => {
        if (!dateString) return 'Data não disponível';
        return new Date(dateString).toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full m-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
                    <h2 className="text-xl font-semibold">Pedido #{order.id} - {order.numero}</h2>
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
                                <p className="text-gray-500">Data: {formatDate(order.dataPedido)}</p>
                                <p className="font-medium text-lg">{formatCurrency(order.pagamento?.valorTotal || 0)}</p>
                            </div>
                            
                            {order.observacoes && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <h3 className="font-semibold mb-1 text-gray-800">Observações do Pedido</h3>
                                    <p className="text-gray-600">{order.observacoes}</p>
                                </div>
                            )}
                            
                            <h3 className="font-semibold mb-2 text-gray-800">Itens do Pedido</h3>
                            <div className="bg-gray-50 rounded-lg p-3 mb-4">
                                {order.itens && order.itens.map((item, index) => (
                                    <div key={item.id || index} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                                        <div className="flex-1">
                                            <p className="font-medium">Item #{item.produtoId}</p>
                                            {item.observacoes && <p className="text-sm text-gray-500">Obs: {item.observacoes}</p>}
                                        </div>
                                        <div className="text-right">
                                            <p>{item.quantidade} x {formatCurrency(item.precoUnitario)}</p>
                                            <p className="font-medium">{formatCurrency(item.subTotal)}</p>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-between pt-3 font-semibold">
                                    <p>Total</p>
                                    <p>{formatCurrency(order.pagamento?.valorTotal || 0)}</p>
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
                                        <p className="text-sm text-gray-500">Logradouro</p>
                                        <p className="font-medium">{order.enderecoEntrega?.logradouro || 'Não informado'}</p>
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
                                                order.pagamento?.pagamentoAprovado ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                                {order.pagamento?.pagamentoAprovado ? 'Aprovado' : 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                    {order.pagamento?.transactionId && (
                                        <div>
                                            <p className="text-sm text-gray-500">ID da Transação</p>
                                            <p className="font-medium font-mono text-sm">{order.pagamento.transactionId}</p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm text-gray-500">Subtotal</p>
                                        <p className="font-medium">{formatCurrency(order.pagamento?.subTotal || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Taxa de Entrega</p>
                                        <p className="font-medium">{formatCurrency(order.pagamento?.taxaEntrega || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Desconto</p>
                                        <p className="font-medium">{formatCurrency(order.pagamento?.desconto || 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Valor Total</p>
                                        <p className="font-medium">{formatCurrency(order.pagamento?.valorTotal || 0)}</p>
                                    </div>
                                    {order.pagamento?.dataAprovacao && (
                                        <div>
                                            <p className="text-sm text-gray-500">Data de Aprovação</p>
                                            <p className="font-medium">{formatDate(order.pagamento.dataAprovacao)}</p>
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
                    {order.status !== 'CANCELADO' && (
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
                            
                            <p className="mb-4 text-gray-600">Este pedido será cancelado e o valor de {formatCurrency(order.pagamento?.valorTotal || 0)} será reembolsado ao cliente. Esta ação não pode ser desfeita.</p>
                            
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