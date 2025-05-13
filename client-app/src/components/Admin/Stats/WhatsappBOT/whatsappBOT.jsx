import React, { useState } from 'react';
import { Phone, CheckCircle } from 'lucide-react';
import MessageTemplate from './MessageTemplate';
import LoginSection from './LoginSection';

const WhatsappBOT = () => {
  const [sessionStatus, setSessionStatus] = useState('disconnected');
  const [activeTab, setActiveTab] = useState('connection');
  const [sessionName, setSessionName] = useState('');

  const handleSessionStatusChange = (status, name) => {
    setSessionStatus(status);
    if (name) setSessionName(name);
    if (status === 'connected') {
      setActiveTab('templates');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            WhatsApp Bot - Gestão de Mensagens
          </h1>
          <p className="text-gray-600">Configure e envie notificações automáticas para seus clientes</p>
        </div>

        {sessionStatus === 'connected' && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-md flex items-center">
            <CheckCircle className="text-green-600 mr-2" size={18} />
            <span className="text-green-800">
              Conectado como <strong>{sessionName}</strong>
            </span>
          </div>
        )}

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
            disabled={sessionStatus !== 'connected'}
            className={`py-2 px-4 font-medium text-sm border-b-2 ${
              sessionStatus !== 'connected'
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Modelos de Mensagem
          </button>
        </div>

        {activeTab === 'connection' && (
          <LoginSection
            onSessionStatusChange={handleSessionStatusChange}
            currentStatus={sessionStatus}
          />
        )}

        {activeTab === 'templates' && (
          <MessageTemplate
            sessionName={sessionName}
            sessionStatus={sessionStatus}
          />
        )}
      </div>
    </div>
  );
};

export default WhatsappBOT;