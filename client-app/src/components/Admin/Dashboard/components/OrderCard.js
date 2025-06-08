import React from 'react';
import { Clock, MapPin, Package, Coffee, Info, DollarSign, ChevronsRight, PlusCircle } from 'lucide-react';

// --- COMPONENTES AUXILIARES PARA MANTER O CÓDIGO LIMPO ---

// Helper para formatar moeda
const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
};

// Componente para exibir uma linha de informação
const InfoItem = ({ icon: Icon, children, className = '' }) => (
    <div className={`flex items-start gap-1.5 ${className}`}>
        <Icon size={14} className="text-slate-400 mt-0.5 flex-shrink-0" />
        <span className="truncate">{children}</span>
    </div>
);

// Componente para exibir um item do pedido com seus detalhes
const OrderItem = ({ item }) => (
    <li className="py-2 border-b border-slate-100 last:border-b-0">
        <div className="flex justify-between items-center font-semibold text-slate-800">
            <span>{item.quantidade}x {item.produtoNome || `Produto #${item.produtoId}`}</span>
            <span>{formatCurrency(item.precoUnitario * item.quantidade)}</span>
        </div>
        
        {/* NOVO: Detalhamento de adicionais */}
        {item.adicionais && item.adicionais.length > 0 && (
            <ul className="pl-4 mt-1 text-xs text-green-700">
                {item.adicionais.map((adicional, index) => (
                    <li key={index} className="flex items-center gap-1">
                        <PlusCircle size={10} />
                        <span>{adicional.nome} (+{formatCurrency(adicional.preco)})</span>
                    </li>
                ))}
            </ul>
        )}

        {/* NOVO: Detalhamento de complementos */}
        {item.complementos && item.complementos.length > 0 && (
            <ul className="pl-4 mt-1 text-xs text-slate-500">
                {item.complementos.map((complemento, index) => (
                     <li key={index} className="flex items-center gap-1">
                        <ChevronsRight size={10} />
                        <span>{complemento.nome}</span>
                    </li>
                ))}
            </ul>
        )}

        {item.observacoes && (
             <p className="pl-4 mt-1 text-xs text-amber-700 italic">Obs: {item.observacoes}</p>
        )}
    </li>
);


// --- COMPONENTE PRINCIPAL ---

const OrderCard = ({ order }) => {
    if (!order) return null;

    // --- LÓGICA DE FORMATAÇÃO E ESTADO ---
    const formattedDate = order.dataPedido
        ? new Date(order.dataPedido).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : 'Data não disponível';

    const totalItems = order.itens?.length || 0;
    
    const enderecoFormatado = order.enderecoEntrega
        ? [order.enderecoEntrega.logradouro, order.enderecoEntrega.numero, order.enderecoEntrega.bairro, order.enderecoEntrega.cidade].filter(Boolean).join(', ')
        : 'Retirada no local';

    const isBlocked = order.status === 'CONCLUIDO' || order.status === 'CANCELADO';
    
    const cardClasses = `bg-white rounded-lg shadow-sm p-4 mb-4 transition-all border border-slate-200 ${
        isBlocked 
          ? 'opacity-70 bg-slate-50' 
          : 'hover:shadow-md hover:-translate-y-0.5 cursor-grab active:cursor-grabbing'
    }`;
    
    // --- HANDLERS DE DRAG & DROP ---
    const handleDragStart = (e) => {
        if (isBlocked) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('application/json', JSON.stringify(order));
        e.currentTarget.classList.add('opacity-50', 'rotate-1');
    };

    const handleDragEnd = (e) => {
        if (!isBlocked) {
            e.currentTarget.classList.remove('opacity-50', 'rotate-1');
        }
    };

    // --- RENDERIZAÇÃO ---
    return (
        <div
            className={cardClasses}
            draggable={!isBlocked}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            {/* Cabeçalho */}
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-200">
                <h4 className="font-bold text-base text-slate-800">{order.numero || 'Sem número'}</h4>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isBlocked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {order.status || 'Status desconhecido'}
                </span>
            </div>

            {/* Informações Gerais */}
            <div className="space-y-2 text-sm text-slate-600 mb-3">
                <InfoItem icon={Clock}>{formattedDate}</InfoItem>
                <InfoItem icon={Package}>{totalItems} {totalItems === 1 ? 'item' : 'itens'}</InfoItem>
                <InfoItem icon={MapPin}>{enderecoFormatado}</InfoItem>
                <InfoItem icon={DollarSign}>
                    Pagamento: {order.pagamento?.formaPagamento || 'Não informado'} - <strong>{formatCurrency(order.pagamento?.valorTotal)}</strong>
                </InfoItem>

                {/* NOVO: Exibição do Troco */}
                {order.pagamento?.formaPagamento?.toLowerCase() === 'dinheiro' && order.pagamento?.trocoPara > 0 && (
                     <InfoItem icon={Info} className="!text-blue-700 font-semibold">
                        Troco para: {formatCurrency(order.pagamento.trocoPara)}
                    </InfoItem>
                )}
            </div>

            {/* Lista de Itens Detalhada */}
            {totalItems > 0 && (
                <div className="border-t border-slate-200 pt-3 mt-3">
                    <p className="text-sm font-bold text-slate-700 mb-1">Itens do pedido:</p>
                    <ul className="text-sm space-y-1">
                        {order.itens.map((item) => (
                            <OrderItem key={item.id} item={item} />
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Observações Gerais */}
            {order.observacoes && order.observacoes.trim() !== '' && (
                <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600 italic">
                    <p><span className="font-semibold not-italic">Observações do Pedido:</span> {order.observacoes}</p>
                </div>
            )}
        </div>
    );
};

export default OrderCard;