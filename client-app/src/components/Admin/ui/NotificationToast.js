import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationToast = ({ order, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); 

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!order) return null;
  return (
    <div 
      className="fixed top-20 right-5 z-50 flex items-center w-full max-w-xs p-4 text-gray-500 bg-white rounded-lg shadow-lg dark:text-gray-400 dark:bg-gray-800 transition-all duration-300 ease-in-out transform animate-fade-in-right"
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
        <Bell className="w-5 h-5" />
        <span className="sr-only">Ícone de sino</span>
      </div>
      <div className="ml-3 text-sm font-normal">
        <div className="text-sm font-semibold text-gray-900 dark:text-white">Novo Pedido Recebido!</div>
        <div className="text-sm font-normal">
          Pedido: <span className="font-semibold">{order.numero || 'N/D'}</span>
        </div>
         <div className="text-sm font-normal">
          Cliente: <span className="font-semibold">{order.finalUserName || 'N/A'}</span>
        </div>
      </div>
      <button 
        type="button" 
        className="ml-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
        onClick={onClose}
        aria-label="Close"
      >
        <span className="sr-only">Fechar</span>
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default NotificationToast;