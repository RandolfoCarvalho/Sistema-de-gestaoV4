import React, { useState } from 'react';

const WhatsappBOT = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('connection');

  // Mock components for demonstration
  const LoginSection = () => (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-medium mb-4">Status de Conexão</h2>
      <button 
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        onClick={() => setIsConnected(!isConnected)}
      >
        {isConnected ? 'Desconectar' : 'Conectar'}
      </button>
      <div className="mt-4">
        Status: <span className={isConnected ? "text-green-500" : "text-red-500"}>
          {isConnected ? "Conectado" : "Desconectado"}
        </span>
      </div>
    </div>
  );

  const MessageTemplate = () => (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-lg font-medium mb-4">Templates de Mensagem</h2>
      <p className="mb-2">
        {isConnected 
          ? "Você está conectado e pode enviar mensagens" 
          : "Você está desconectado. Alguns recursos podem estar limitados."}
      </p>
      <div className="mt-4 border rounded p-4">
        <h3 className="font-medium">Template de Boas-vindas</h3>
        <p className="text-gray-700 mt-2">Olá, seja bem-vindo! Como posso ajudar?</p>
        <button 
          className={`mt-3 px-4 py-2 rounded ${
            isConnected 
              ? "bg-blue-500 text-white hover:bg-blue-600" 
              : "bg-blue-300 text-white"
          }`}
        >
          Enviar
        </button>
      </div>
    </div>
  );

  const handleSessionConnected = () => {
    setIsConnected(true);
  };

  const handleSessionDisconnected = () => {
    setIsConnected(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          WhatsApp Bot - Gestão de Mensagens
        </h1>
        <p className="text-gray-600">
          Configure e envie notificações automáticas para seus clientes
        </p>
      </div>
      
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex">
          <button
            onClick={() => setActiveTab('connection')}
            className={`py-2 px-4 font-medium text-sm mr-4 border-b-2 ${
              activeTab === 'connection'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Conexão
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              activeTab === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Modelos de Mensagem
          </button>
        </nav>
      </div>
      
      {activeTab === 'connection' && (
        <LoginSection />
      )}
      
      {activeTab === 'templates' && (
        <MessageTemplate />
      )}
    </div>
  );
};

export default WhatsappBOT;