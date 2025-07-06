// WhatsappBOT.js
import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import MessageTemplate from './MessageTemplate';
import LoginSection from './LoginSection';
import ChatInterface from './ChatInterface';
import axios from 'axios';

const baseUrl = process.env.REACT_APP_WHATSAPPBOT_VPS;

const WhatsappBOT = () => {
  const [sessionStatus, setSessionStatus] = useState('disconnected');
  const [activeTab, setActiveTab] = useState('connection');
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSessionStatusChange = (status, name) => {
    setSessionStatus(status);
    if (name) setSessionName(name);
    if (status === 'connected') {
      setActiveTab('chat');
    }
  };

const desconectarSessao = async () => {
    if (sessionStatus !== 'connected') return;
    setLoading(true);
    try {
      await axios.get(`${baseUrl}/logout/${sessionName}`);
      window.location.reload();
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      alert('Erro ao tentar desconectar. A página será recarregada para garantir o estado correto.');
      window.location.reload();
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
};

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
            WhatsApp Bot - Gestão de Mensagens
          </h1>
          <p className="text-gray-600">Configure, automatize e converse com seus clientes</p>
        </div>

        {sessionStatus === 'connected' && (
          <div className="mb-4 p-3 bg-green-100 border border-green-200 rounded-md flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={18} />
              <span className="text-green-800">
                Conectado como <strong>{sessionName}</strong>
              </span>
            </div>
            <button
              onClick={desconectarSessao}
              className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
              disabled={loading}
            >
              {loading ? 'Desconectando...' : 'Desconectar'}
            </button>
          </div>
        )}

        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('connection')}
            className={`py-2 px-4 font-medium text-sm mr-2 border-b-2 ${
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
            className={`py-2 px-4 font-medium text-sm mr-2 border-b-2 ${
              sessionStatus !== 'connected'
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Modelos de Mensagem
          </button>
          {/* BOTÃO DA NOVA ABA DE CHAT */}
          <button
            onClick={() => setActiveTab('chat')}
            disabled={sessionStatus !== 'connected'}
            className={`py-2 px-4 font-medium text-sm mr-2 border-b-2 ${
              sessionStatus !== 'connected'
                ? 'border-transparent text-gray-400 cursor-not-allowed'
                : activeTab === 'chat'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Chat em Tempo Real
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
        
        {/* RENDERIZAÇÃO CONDICIONAL DO COMPONENTE DE CHAT */}
        {activeTab === 'chat' && (
          <ChatInterface
            onSessionStatusChange={handleSessionStatusChange}
            sessionName={sessionName}
            sessionStatus={sessionStatus}
          />
        )}
      </div>
    </div>
  );
};

export default WhatsappBOT;