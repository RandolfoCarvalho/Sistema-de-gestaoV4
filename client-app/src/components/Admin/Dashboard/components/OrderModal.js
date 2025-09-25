import React, { useState } from 'react';
import axios from 'axios';
import { X, Printer, Coins, PlusCircle, ChevronsRight, Loader2, AlertTriangle } from 'lucide-react';

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data indisponível';

const getStatusInfo = (status) => {
    const s = (status || '').toUpperCase();
    const statusMap = {
        'NOVO': { text: 'Novo', style: 'bg-green-100 text-green-800' },
        'CONFIRMADO': { text: 'Confirmado', style: 'bg-blue-100 text-blue-800' },
        'EM_PRODUCAO': { text: 'Em Preparo', style: 'bg-amber-100 text-amber-800' },
        'EM_ENTREGA': { text: 'Em Entrega', style: 'bg-indigo-100 text-indigo-800' },
        'CONCLUIDO': { text: 'Concluído', style: 'bg-slate-200 text-slate-800' },
        'CANCELADO': { text: 'Cancelado', style: 'bg-red-100 text-red-800' },
    };
    return statusMap[s] || { text: s, style: 'bg-gray-100 text-gray-800' };
};
const TabButton = ({ label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm transition-all ${isActive ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`}
    >
        {label}
    </button>
);

const InfoCard = ({ title, children }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h3 className="font-semibold mb-3 text-slate-800">{title}</h3>
        <div className="space-y-3">{children}</div>
    </div>
);

const InfoPair = ({ label, value }) => (
    <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-slate-700">{value || 'Não informado'}</p>
    </div>
);

const ItemDetailRow = ({ item }) => (
    <div className="py-3 border-b border-slate-200 last:border-b-0">
        <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
                <p className="font-semibold text-slate-800">{item.quantidade}x {item.produtoNome}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    {item.totalAdicionais > 0 && (
                        <span className="flex items-center gap-1">
                            <PlusCircle size={12} className="text-green-500" /> {item.totalAdicionais} Adicional(is)
                        </span>
                    )}
                    {item.totalComplementos > 0 && (
                         <span className="flex items-center gap-1">
                            <ChevronsRight size={12} className="text-slate-400" /> {item.totalComplementos} Complemento(s)
                        </span>
                    )}
                </div>
            </div>
            <span className="font-mono text-sm">{formatCurrency(item.subTotal)}</span>
        </div>
        {item.adicionais?.length > 0 && (
            <ul className="pl-5 mt-2 space-y-1 text-xs text-green-700">
                {item.adicionais.map((ad, i) => <li key={i} className="flex items-center gap-1.5"><PlusCircle size={12} />{ad.nome} (+{formatCurrency(ad.preco)})</li>)}
            </ul>
        )}
        {item.complementos?.length > 0 && (
            <ul className="pl-5 mt-2 space-y-1 text-xs text-slate-500">
                {item.complementos.map((c, i) => <li key={i} className="flex items-center gap-1.5"><ChevronsRight size={12} />{c.nome}</li>)}
            </ul>
        )}
        {item.observacoes && <p className="pl-5 mt-2 text-xs text-amber-700 italic">Obs: {item.observacoes}</p>}
    </div>
);

const OrderModal = ({ order, onClose }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [motivoCancelamento, setMotivoCancelamento] = useState('');
    const [activeTab, setActiveTab] = useState('detalhes');
    if (!order) return null;

    const handleCancelOrder = async () => {
        if (!motivoCancelamento.trim()) {
            setError('Por favor, informe o motivo do cancelamento.');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/buscarTransactionId/${order.id}`);
            const pedidoCompleto = res.data;

            if (!pedidoCompleto) {
                setError('Não foi possível carregar os detalhes do pedido para o cancelamento.');
                setLoading(false);
                return;
            }

            const formasPagamentoOffline = ['dinheiro', 'pagar na retirada', 'maquininha'];
            const formaPagamentoAtual = (pedidoCompleto.pagamento?.formaPagamento || '').toLowerCase();

            if (formasPagamentoOffline.includes(formaPagamentoAtual)) {
                await cancelOrderWithoutRefund(pedidoCompleto);
            } else {
                await cancelOrderWithRefund(pedidoCompleto);
            }
            setTimeout(() => {
                window.location.reload();
            }, 3000); 
        } catch (err) {
            console.error("Erro na etapa inicial de cancelamento:", err);
            setError('Erro ao iniciar o processo de cancelamento. Tente novamente.');
        }
    };

    const cancelOrderWithoutRefund = async (pedido) => {
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Pedido/registrarCancelamento`, {
                pedidoId: pedido.id,
                motivoCancelamento: motivoCancelamento,
                codigoReembolso: '',
                valorReembolsado: 0, 
                transacaoReembolsoId: '',
                
                estaReembolsado: false,
                finalUserId: pedido.finalUserId,
            });

            showSuccessNotification('Pedido cancelado com sucesso!');
        } catch (err) {
            console.error("Erro ao cancelar pedido (sem estorno):", err);
            setError('Erro ao registrar o cancelamento. Por favor, tente novamente.');
        }
    };

    const cancelOrderWithRefund = async (pedido) => {
        try {
            const transactionId = pedido.pagamento?.transactionId;

            if (!transactionId) {
                setError('ID da transação não encontrado. Não é possível processar o reembolso.');
                return;
            }

            const reembolsoResult = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/MercadoPago/processaReembolso`, {
                transactionId: transactionId,
                Amount: pedido.pagamento?.valorTotal || 0,
                RestauranteId: pedido.restauranteId,
            });
            await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Pedido/registrarCancelamento`, {
                pedidoId: pedido.id,
                motivoCancelamento: motivoCancelamento,
                codigoReembolso: reembolsoResult.data?.id || '',
                valorReembolsado: pedido.pagamento?.valorTotal || 0,
                transacaoReembolsoId: transactionId,
                estaReembolsado: true,
                finalUserId: pedido.finalUserId,
            });

            showSuccessNotification('Pedido cancelado e reembolsado com sucesso!');
        } catch (err)
        {
            console.error("Erro ao cancelar e reembolsar:", err);
            setError('Erro ao processar o reembolso. A transação pode já ter sido estornada ou houve uma falha na comunicação.');
        }
    };

    const showSuccessNotification = (message) => {
        setShowConfirm(false);
        const notificacao = document.createElement('div');
        notificacao.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded shadow-lg z-50 animate-fade-in-down';
        notificacao.textContent = message;
        document.body.appendChild(notificacao);

        setTimeout(() => {
            notificacao.remove();
            onClose();
        }, 3000);
    };
    const statusInfo = getStatusInfo(order.status);
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-zoom-in">
                <div className="p-5 border-b flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Pedido {order.numero}</h2>
                        <span className="text-sm text-slate-500">ID: {order.id}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${statusInfo.style}`}>{statusInfo.text}</span>
                        <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"><X size={20} /></button>
                    </div>
                </div>

                <div className="flex border-b border-slate-200 px-2">
                    <TabButton label="Detalhes do Pedido" isActive={activeTab === 'detalhes'} onClick={() => setActiveTab('detalhes')} />
                    <TabButton label="Cliente e Entrega" isActive={activeTab === 'entrega'} onClick={() => setActiveTab('entrega')} />
                    <TabButton label="Pagamento" isActive={activeTab === 'pagamento'} onClick={() => setActiveTab('pagamento')} />
                </div>

                <div className="p-6 overflow-y-auto flex-grow bg-white">
                    {activeTab === 'detalhes' && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-slate-500">Data: <span className="font-medium text-slate-700">{formatDate(order.dataPedido)}</span></p>
                                <p className="font-bold text-lg text-slate-800">{formatCurrency(order.pagamento?.valorTotal)}</p>
                            </div>
                            
                            {order.observacoes && (
                                <InfoCard title="Observações Gerais do Pedido">
                                    <p className="italic text-slate-600">{order.observacoes}</p>
                                </InfoCard>
                            )}

                            <InfoCard title="Itens do Pedido">
                                <ul className="divide-y divide-slate-200 -mt-3">
                                    {order.itens?.map(item => <ItemDetailRow key={item.id} item={item} />)}
                                </ul>
                            </InfoCard>
                        </div>
                    )}
                    {activeTab === 'entrega' && (
                        <div className="space-y-5">
                            <InfoCard title="Dados do Cliente">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoPair label="Nome" value={order.finalUser?.nome || order.finalUserName} />
                                    <InfoPair label="Telefone" value={order.finalUser?.telefone || order.finalUserTelefone} />
                                </div>
                            </InfoCard>
                            <InfoCard title="Endereço de Entrega">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InfoPair label="Endereço" value={`${order.enderecoEntrega?.logradouro || ''}, ${order.enderecoEntrega?.numero || ''}`} />
                                    <InfoPair label="Bairro" value={order.enderecoEntrega?.bairro} />
                                    <InfoPair label="Cidade" value={order.enderecoEntrega?.cidade} />
                                    <InfoPair label="CEP" value={order.enderecoEntrega?.cep} />
                                    <div className="md:col-span-2"><InfoPair label="Complemento" value={order.enderecoEntrega?.complemento} /></div>
                                </div>
                            </InfoCard>
                        </div>
                    )}
                    {activeTab === 'pagamento' && (
                        <InfoCard title="Detalhes do Pagamento">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InfoPair label="Forma de Pagamento" value={order.pagamento?.formaPagamento} />
                                <InfoPair label="Status" value={order.pagamento?.pagamentoAprovado ? 'Aprovado' : 'Pendente'} />
                                <div className="md:col-span-2"><InfoPair label="ID da Transação" value={order.pagamento?.transactionId} /></div>
                                <InfoPair label="Subtotal" value={formatCurrency(order.pagamento?.subTotal)} />
                                <InfoPair label="Taxa de Entrega" value={formatCurrency(order.pagamento?.taxaEntrega)} />
                                <InfoPair label="Desconto" value={formatCurrency(order.pagamento?.desconto)} />
                                <div className="font-bold text-slate-800"><InfoPair label="Valor Total" value={formatCurrency(order.pagamento?.valorTotal)} /></div>

                                {order.pagamento?.formaPagamento?.toLowerCase() === 'dinheiro' && order.pagamento?.trocoPara > 0 && (
                                    <div className="md:col-span-2 mt-2 p-3 bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-800">
                                        <Coins size={18} />
                                        <span className="font-semibold text-sm">Troco para: {formatCurrency(order.pagamento.trocoPara)}</span>
                                    </div>
                                )}
                            </div>
                        </InfoCard>
                    )}
                </div>

                <div className="p-4 border-t bg-slate-50 rounded-b-xl flex justify-end gap-3">
                    <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2"><Printer size={16} /> Imprimir</button>
                    {order.status !== 'CANCELADO' && <button onClick={() => setShowConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center gap-2"><X size={16} /> Cancelar Pedido</button>}
                </div>

                {showConfirm && (
                    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full animate-zoom-in">
                            <div className="mb-4 flex items-center"><AlertTriangle className="h-8 w-8 mr-3 text-red-500" /><h3 className="text-lg font-bold text-slate-800">Cancelar e Reembolsar</h3></div>
                            <p className="mb-4 text-slate-600">O valor de <strong>{formatCurrency(order.pagamento?.valorTotal)}</strong> será reembolsado. Esta ação não pode ser desfeita.</p>
                            <div className="mb-4"><label className="block text-sm font-medium mb-1 text-slate-700">Motivo do Cancelamento:</label><textarea value={motivoCancelamento} onChange={(e) => setMotivoCancelamento(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" rows="3" placeholder="Ex: Item indisponível" /></div>
                            {error && <div className="mb-4 p-2 bg-red-50 border-l-4 border-red-500 text-red-700"><p className="text-sm">{error}</p></div>}
                            <div className="flex justify-end gap-3 mt-4">
                                <button onClick={() => { setShowConfirm(false); setError(''); }} disabled={loading} className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100">Voltar</button>
                                <button onClick={handleCancelOrder} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed flex items-center">{loading ? <><Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> Processando...</> : 'Confirmar Cancelamento'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderModal;