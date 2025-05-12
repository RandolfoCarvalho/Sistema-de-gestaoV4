import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, CheckCircle, Send, Loader } from 'lucide-react';
import MessageTemplate from './MessageTemplate';
import LoginSection from './LoginSection';

const WhatsappBOT: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'connection' | 'templates'>('connection');
  
  const handleSessionConnected = () => {
    setIsConnected(true);
    //setActiveTab('templates');
  };

  const handleSessionDisconnected = () => {
    setIsConnected(false);
    setActiveTab('connection');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">WhatsApp Bot - Gestão de Mensagens</h1>
          <p className="text-gray-600">Configure e envie notificações automáticas para seus clientes</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex border-b mb-6">
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
        </div>

        {activeTab === 'connection' && (
          <LoginSection 
            onSessionConnected={handleSessionConnected} 
            onSessionDisconnected={handleSessionDisconnected}
          />
        )}

        {activeTab === 'templates' && (
          <MessageTemplate />
        )}
      </div>
    </div>
  );
};

export default WhatsappBOT;
