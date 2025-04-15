import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import OrderCard  from './OrderCard';

const StatusColumn = ({ id, title, orders = [], config, onDrop }) => {
    const Icon = config.icon;

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'scale-[1.01]');
    };

    const handleDragLeave = (e) => {
        e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'scale-[1.01]');
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'scale-[1.01]');
        try {
            const order = JSON.parse(e.dataTransfer.getData('application/json'));
            onDrop(order, id);
        } catch (error) {
            console.error('Erro ao processar drop:', error);
        }
    };

    return (
        <div className={`${config.bg} rounded-xl shadow-lg transition-all flex-1 min-w-[300px]`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className={`p-4 ${config.headerBg} rounded-t-xl`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className="text-white" size={20} />
                        <h3 className="font-semibold text-white">{title}</h3>
                    </div>
                    <span className="px-2 py-1 bg-white text-gray-700 rounded-full text-sm">{orders.length}</span>
                </div>
            </div>

            <div className="p-4 h-[calc(100vh-400px)] overflow-y-auto">
                {orders.map((order) => (
                    <OrderCard key={order.id} order={order} />
                ))}
                {orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                        <AlertCircle size={24} />
                        <p className="mt-2 text-sm">Nenhum pedido neste status.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatusColumn;

