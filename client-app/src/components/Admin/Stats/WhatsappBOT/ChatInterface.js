// ChatInterface.js - CORRIGIDO E COMPLETO FINAL

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageSquare, Send, User, Bot, PhoneOff, X } from 'lucide-react';

const ChatInterface = ({ sessionName, sessionStatus, onSessionStatusChange  }) => {
  const [conversations, setConversations] = useState({});
  const [activeConversation, setActiveConversation] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [conversationStates, setConversationStates] = useState({});
  const socketRef = useRef(null);
  const chatEndRef = useRef(null);
  
  const baseUrl = process.env.REACT_APP_WHATSAPPBOT_VPS;

  useEffect(() => {
    if (sessionStatus === 'connected' && sessionName) {
      socketRef.current = io(baseUrl);
      
      socketRef.current.on('connect', () => {
        console.log("Socket conectado, requisitando histórico...");
        socketRef.current.emit('joinRoom', sessionName);
        socketRef.current.emit('requestHistory', sessionName);
      });

      //listener para saber se a sessao foi conectada
      socketRef.current.on('sessionConnected', (data) => {
        console.log('Sessão conectada via Socket.IO:', data.session);
        if (data.session === sessionName) {
          onSessionStatusChange('connected', sessionName);
        }
      });
      
      // ================================================================
      // CORREÇÃO: Recebe e formata o histórico de estados corretamente
      // ================================================================
      socketRef.current.on('historyResponse', (history) => {
        console.log("Histórico recebido:", history);
        setConversations(history.messages || {});
        
        const formattedStates = {};
        for (const key in history.states) {
            // A chave do estado vem como 'state:session:55xxxxxxxx@c.us'
            // A chave da conversa é '55xxxxxxxx'
            const phoneWithoutSuffix = key.split('@')[0];
            formattedStates[phoneWithoutSuffix] = history.states[key];
        }
        setConversationStates(formattedStates);
      });

      socketRef.current.on('newMessage', (message) => {
        const conversationId = message.from.split('@')[0];
        setConversations(prev => {
          const newConversations = { ...prev };
          const existingMessages = newConversations[conversationId] || [];
          if (existingMessages.find(m => m.timestamp === message.timestamp && m.body === message.body)) {
              return prev;
          }
          newConversations[conversationId] = [...existingMessages, message];
          return newConversations;
        });
      });
      
      socketRef.current.on('stateUpdated', ({ phone, state }) => {
        setConversationStates(prev => ({
          ...prev,
          [phone]: state
        }));
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [sessionStatus, sessionName, baseUrl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversation]);


  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversation || !socketRef.current) return;
    
    socketRef.current.emit('sendMessageFromUI', {
      session: sessionName,
      phone: activeConversation,
      message: messageInput
    });
    
    setMessageInput('');
  };

  const handleEndService = (phoneToEnd) => {
    if (phoneToEnd && socketRef.current) {
      socketRef.current.emit('endHumanService', {
        session: sessionName,
        phone: phoneToEnd
      });
    }
  };
  
  const getDisplayName = (phone) => phone;
  const isHumanServiceActive = conversationStates[activeConversation] === 'transferred_to_agent';

  // O JSX do componente permanece o mesmo.
  return (
    <div className="flex h-[70vh] bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl shadow-2xl border border-slate-200/50">
      <div className="w-1/3 bg-white/80 backdrop-blur-sm border-r border-slate-200/50 rounded-l-2xl overflow-hidden flex flex-col">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold">Conversas Ativas</h2>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {Object.keys(conversations).length === 0 ? (
            <div className="p-8 text-center h-full flex flex-col justify-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-slate-500 font-medium">Aguardando mensagens...</p>
              <p className="text-slate-400 text-sm mt-1">Novas conversas aparecerão aqui</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {Object.keys(conversations).sort((a,b) => (conversations[b][conversations[b].length-1].timestamp) - (conversations[a][conversations[a].length-1].timestamp)).map(phone => (
                <div 
                  key={phone} 
                  onClick={() => setActiveConversation(phone)}
                  className={`group relative p-4 cursor-pointer rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${
                    activeConversation === phone 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-md' 
                      : 'hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        activeConversation === phone 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg' 
                          : 'bg-gradient-to-br from-slate-300 to-slate-400 group-hover:from-slate-400 group-hover:to-slate-500'
                      }`}>
                        <User className="w-6 h-6 text-white" />
                        {conversationStates[phone] === 'transferred_to_agent' && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate">{getDisplayName(phone)}</p>
                        <p className="text-sm text-slate-500 truncate mt-1">
                          {conversations[phone][conversations[phone].length - 1].body}
                        </p>
                      </div>
                    </div>
                    {conversationStates[phone] === 'transferred_to_agent' && (
                      <div className="ml-2 flex-shrink-0 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                          Ativo
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEndService(phone);
                          }}
                          className="p-1 rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                          title="Forçar encerramento do atendimento"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="w-2/3 flex flex-col bg-white rounded-r-2xl overflow-hidden">
        {activeConversation ? (
          <>
            <div className="relative p-6 bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-lg z-10 flex-shrink-0">
              <div className="flex items-center justify-between min-h-[60px] w-full">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="relative w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                    {isHumanServiceActive && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-bold truncate">{getDisplayName(activeConversation)}</h2>
                    <p className="text-slate-300 text-sm">
                      {isHumanServiceActive ? 'Atendimento ativo' : 'Cliente'}
                    </p>
                  </div>
                </div>
                {isHumanServiceActive && (
                  <div className="flex-shrink-0 ml-4 relative">
                    <button 
                      onClick={() => handleEndService(activeConversation)}
                      className="group relative flex items-center bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-red-400 shadow-lg whitespace-nowrap">
                      <PhoneOff size={18} className="mr-2 group-hover:animate-pulse" />
                      Encerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
              <div className="space-y-4">
                {conversations[activeConversation] && conversations[activeConversation].map((msg, index) => {
                  const isAttendant = msg.isMe;
                  const isBotMsg = msg.isBot;
                  return (
                    <div key={index} className={`flex items-end space-x-2 ${isAttendant ? 'justify-end' : 'justify-start'}`}>
                      {isBotMsg && !isAttendant && (
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg mb-1 flex-shrink-0">
                          <Bot className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={`group relative max-w-md transition-all duration-300 hover:scale-[1.02] ${ isAttendant ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg hover:shadow-xl' : isBotMsg ? 'bg-gradient-to-br from-purple-100 to-pink-100 text-slate-800 shadow-md hover:shadow-lg border border-purple-200' : 'bg-white text-slate-800 shadow-md hover:shadow-lg border border-slate-200'} rounded-2xl px-5 py-3`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.body}</p>
                        <p className={`text-xs mt-2 text-right ${ isAttendant ? 'text-blue-100' : 'text-slate-400'}`}>
                          {new Date(msg.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {isAttendant && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg mb-1 flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
            </div>
            <div className="p-6 bg-gradient-to-r from-slate-50 to-white border-t border-slate-200 flex-shrink-0">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <input
                    type="text" 
                    value={messageInput} 
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md placeholder-slate-400"
                  />
                </div>
                <button 
                  type="submit" 
                  className="group bg-gradient-to-br from-blue-500 to-purple-600 text-white p-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 focus:outline-none transition-all duration-300 hover:scale-110 hover:shadow-lg disabled:opacity-50 shadow-lg"
                  disabled={!messageInput.trim()}
                >
                  <Send size={20} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-white text-slate-400">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center mx-auto shadow-lg">
                <MessageSquare size={40} className="text-slate-400" />
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-600 mb-2">Selecione uma conversa</p>
                <p className="text-slate-400">Escolha uma conversa da lista para começar a atender</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;