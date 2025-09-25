import React from 'react';
// IMPORTAÇÃO DO NOVO ÍCONE 'STORE'
import { User, Phone, MapPin, DollarSign, List, MessageSquare, Printer, X, Coins, PlusCircle, ChevronsRight, Store, Truck } from 'lucide-react';

// --- HELPERS & SUB-COMPONENTES ---

const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateString) => new Date(dateString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// LÓGICA DE STATUS APRIMORADA PARA ENTENDER O TIPO DE ENTREGA
const getStatusInfo = (status, tipoEntrega) => {
    const s = (status || '').toUpperCase();
    
    // Se for um pedido para retirada, o status 'EM_ENTREGA' é interpretado como 'PRONTO_PARA_RETIRADA'
    if (tipoEntrega === 'RETIRADA' && (s === 'EM_ENTREGA' || s === 'PRONTO_PARA_RETIRADA')) {
        return { text: 'Pronto para Retirada', style: 'bg-purple-100 text-purple-800' };
    }

    switch (s) {
        case 'NOVO': return { text: 'Novo', style: 'bg-green-100 text-green-800' };
        case 'EM_PRODUCAO': return { text: 'Em Preparo', style: 'bg-amber-100 text-amber-800' };
        case 'EM_ENTREGA': return { text: 'Em Entrega', style: 'bg-blue-100 text-blue-800' };
        case 'CONCLUIDO': return { text: 'Concluído', style: 'bg-slate-200 text-slate-800' };
        case 'CANCELADO': return { text: 'Cancelado', style: 'bg-red-100 text-red-800' };
        default: return { text: s, style: 'bg-gray-100 text-gray-800' };
    }
};

const DetailSection = ({ icon: Icon, title, children }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
        <h3 className="flex items-center text-md font-semibold text-slate-700 mb-3">
            <Icon size={18} className="mr-2 text-indigo-500" />
            {title}
        </h3>
        <div className="space-y-2 text-sm text-slate-600">{children}</div>
    </div>
);

const InfoPair = ({ label, value }) => (
    <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium">{value || 'Não informado'}</p>
    </div>
);

const ItemDetailRow = ({ item }) => (
    <div className="py-3 border-b border-slate-200 last:border-0">
        <div className="flex justify-between items-start font-semibold text-slate-800">
            <span className="flex-1 pr-4">{item.quantidade}x {item.produtoNome}</span>
            <span className="font-mono">{formatCurrency(item.subTotal)}</span>
        </div>
        {item.adicionais?.length > 0 && (
            <ul className="pl-5 mt-1.5 space-y-1 text-xs text-green-700">
                {item.adicionais.map((ad, i) => <li key={i} className="flex items-center gap-1.5"><PlusCircle size={12} />{ad.nome} (+{formatCurrency(ad.preco)})</li>)}
            </ul>
        )}
        {item.complementos?.length > 0 && (
            <ul className="pl-5 mt-1.5 space-y-1 text-xs text-slate-500">
                {item.complementos.map((c, i) => <li key={i} className="flex items-center gap-1.5"><ChevronsRight size={12} />{c.nome}</li>)}
            </ul>
        )}
    </div>
);

// --- COMPONENTE PRINCIPAL DO MODAL ---

const OrderDetailsModal = ({ order, isOpen, onClose }) => {
    if (!isOpen || !order) return null;

    // A FUNÇÃO AGORA RECEBE O TIPO DE ENTREGA PARA DECIDIR O TEXTO CORRETO DO STATUS
    const statusInfo = getStatusInfo(order.status, order.tipoEntrega);
    const endereco = order.enderecoEntrega;
    const pagamento = order.pagamento;

    const downloadAsXML = () => {
        const createXML = (orderData) => {
            const itensXML = orderData.itens?.map(item => `
                  <item>
                    <nome>${item.produtoNome}</nome>
                    <quantidade>${item.quantidade}</quantidade>
                    <precoUnitario>${item.precoUnitario}</precoUnitario>
                    <subTotal>${item.subTotal}</subTotal>
                    <observacoes>${item.observacoes || ''}</observacoes>
                    <adicionais>${item.adicionais?.map(ad => `${ad.nome} (+${ad.preco})`).join(', ') || ''}</adicionais>
                    <complementos>${item.complementos?.map(c => c.nome).join(', ') || ''}</complementos>
                  </item>
                `).join('') || '';

            const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
            <pedido>
              <id>${orderData.id}</id>
              <numero>${orderData.numero}</numero>
              <cliente>${orderData.finalUser?.nome || orderData.finalUserName}</cliente>
              <status>${orderData.status}</status>
              <dataCriacao>${orderData.dataPedido}</dataCriacao>
              <enderecoEntrega>
                <rua>${orderData.enderecoEntrega?.logradouro || ''}</rua>
                <numero>${orderData.enderecoEntrega?.numero || ''}</numero>
                <bairro>${orderData.enderecoEntrega?.bairro || ''}</bairro>
                <cidade>${orderData.enderecoEntrega?.cidade || ''}</cidade>
                <cep>${orderData.enderecoEntrega?.cep || ''}</cep>
                <complemento>${orderData.enderecoEntrega?.complemento || ''}</complemento>
              </enderecoEntrega>
              <pagamento>
                <formaPagamento>${orderData.pagamento?.formaPagamento || ''}</formaPagamento>
                <trocoPara>${orderData.pagamento?.trocoPara || 0}</trocoPara>
                <subTotal>${orderData.pagamento?.subTotal || 0}</subTotal>
                <taxaEntrega>${orderData.pagamento?.taxaEntrega || 0}</taxaEntrega>
                <valorTotal>${orderData.pagamento?.valorTotal || 0}</valorTotal>
              </pagamento>
              <observacoes>${orderData.observacoes || ''}</observacoes>
              <itens>${itensXML}</itens>
            </pedido>`;

            const blob = new Blob([xmlContent.trim()], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `pedido-${orderData.numero}.xml`;
            a.click();
            window.URL.revokeObjectURL(url);
        };
        createXML(order);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col animate-zoom-in">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center p-5 border-b border-slate-200 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Detalhes do Pedido</h2>
                        <span className="text-sm text-slate-500">{order.numero}</span>
                    </div>
                    <span className={`text-sm font-semibold px-3 py-1.5 rounded-full ${statusInfo.style}`}>{statusInfo.text}</span>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"><X size={20} /></button>
                </div>
                
                {/* Corpo do Modal */}
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
                    {/* Coluna Esquerda: Itens do Pedido */}
                    <div className="lg:col-span-2 space-y-4">
                        <DetailSection icon={List} title="Itens do Pedido">
                            <ul className="divide-y divide-slate-200">
                                {order.itens?.map((item) => <ItemDetailRow key={item.id} item={item} />)}
                            </ul>
                        </DetailSection>

                        {order.observacoes && (
                            <DetailSection icon={MessageSquare} title="Observações Gerais">
                                <p className="italic text-slate-700">{order.observacoes}</p>
                            </DetailSection>
                        )}
                    </div>

                    {/* Coluna Direita: Informações Resumidas */}
                    <div className="space-y-5">
                        <DetailSection icon={User} title="Cliente">
                            <InfoPair label="Nome" value={order.finalUser?.nome || order.finalUserName} />
                            <InfoPair label="Telefone" value={order.finalUser?.telefone || order.finalUserTelefone} />
                        </DetailSection>

                        {/* SEÇÃO DE ENTREGA/RETIRADA RENDERIZADA CONDICIONALMENTE */}
                        {order.tipoEntrega === 'RETIRADA' ? (
                            <DetailSection icon={Store} title="Retirada no Balcão">
                                <p className="font-medium text-slate-700">Este pedido é para ser retirado na loja.</p>
                                <p>Não há endereço de entrega associado.</p>
                            </DetailSection>
                        ) : (
                            <DetailSection icon={MapPin} title="Entrega">
                                <p>{`${endereco?.logradouro || ''}, ${endereco?.numero || ''}`}</p>
                                <p>{`${endereco?.bairro || ''} - ${endereco?.cidade || ''}`}</p>
                                <p>{endereco?.cep || ''}</p>
                                {endereco?.complemento && <InfoPair label="Complemento" value={endereco.complemento} />}
                            </DetailSection>
                        )}

                        <DetailSection icon={DollarSign} title="Pagamento">
                            <InfoPair label="Forma de Pagamento" value={pagamento?.formaPagamento} />
                            <div className="pt-2 mt-2 border-t border-slate-200 space-y-1">
                                <InfoPair label="Subtotal" value={formatCurrency(pagamento?.subTotal)} />
                                {/* TAXA DE ENTREGA SÓ É EXIBIDA SE FOR DO TIPO DELIVERY */}
                                {order.tipoEntrega === 'DELIVERY' && (
                                    <InfoPair label="Taxa de Entrega" value={formatCurrency(pagamento?.taxaEntrega)} />
                                )}
                                <p className="text-sm font-bold text-slate-800 flex justify-between"><span>Total</span> <span>{formatCurrency(pagamento?.valorTotal)}</span></p>
                            </div>
                            {pagamento?.formaPagamento?.toLowerCase() === 'dinheiro' && pagamento?.trocoPara > 0 && (
                                <div className="!mt-3 p-3 bg-blue-100 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-800">
                                    <Coins size={18} />
                                    <span className="font-semibold">Troco para: {formatCurrency(pagamento.trocoPara)}</span>
                                </div>
                            )}
                        </DetailSection>
                    </div>
                </div>

                {/* Rodapé */}
                <div className="p-5 border-t border-slate-200 flex justify-end flex-shrink-0 bg-slate-50 rounded-b-xl">
                    <button onClick={downloadAsXML} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        <Printer size={16} />
                        Gerar Nota (XML)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsModal;