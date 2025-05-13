// LoginSection.jsx
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Phone, CheckCircle, PhoneOff, Slash, Loader } from 'lucide-react';

const LoginSection = ({ onSessionStatusChange, currentStatus }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const baseUrl = process.env.REACT_APP_WHATSAPPBOT_VPS;
  const isMounted = useRef(true);

  // Efeito para buscar informações do restaurante e verificar status na inicialização
  useEffect(() => {
    isMounted.current = true;
    
    const setupSession = async () => {
      try {
        setLoading(true);
        // Busca informações do restaurante
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/GetRestauranteInfo`);
        const name = res.data.restaurante.nomeDaLoja;
        
        if (isMounted.current) {
          localStorage.setItem('restaurantName', name);
          setSessionName(name);
          
          // Verifica o status da sessão
          await checkSessionStatus(name);
        }
      } catch (error) {
        console.error('Erro ao buscar nome do restaurante:', error);
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    setupSession();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Função para verificar status da sessão
  const checkSessionStatus = async (name) => {
    try {
      const res = await axios.get(`${baseUrl}/status/${name}`);
      
      if (res.data.status === 'connected' && isMounted.current) {
        setQrCode(null);
        onSessionStatusChange('connected', name);
      }
    } catch (error) {
      if (isMounted.current) {
        onSessionStatusChange('disconnected');
        console.log('Sessão não encontrada ou desconectada.');
      }
    }
  };

  // Função para iniciar a sessão
  const iniciarSessao = async () => {
    if (!sessionName) {
      alert('Nome da sessão não disponível. Tente novamente.');
      return;
    }
    
    setLoading(true);
    setQrCode(null);
    onSessionStatusChange('connecting');

    try {
      // Inicia a sessão no servidor
      await axios.post(`${baseUrl}/start-session`, { session: sessionName });

      let tentativas = 0;
      const maxTentativas = 60; // Aumentando bastante o tempo de espera para garantir que o Venom gere o QR
      
      console.log('Aguardando geração do QR Code pelo Venom...');

      // Pooling para obter o QR Code com tempo adicional
      const intervalo = setInterval(async () => {
        if (!isMounted.current) {
          clearInterval(intervalo);
          return;
        }
        
        try {
          const res = await axios.get(`${baseUrl}/qrcode/${sessionName}`);
          
          // Verificando se obtivemos uma resposta válida do servidor
          if (res.data && res.data.qrCode) {
            // Usar exatamente o QR code que veio do servidor Venom, sem manipulação
            if (isMounted.current) {
              console.log('QR Code do Venom recebido!');
              // Definir QR code exatamente como retornado pelo servidor
              setQrCode(res.data.qrCode);
              setLoading(false);
              clearInterval(intervalo);
              
              // Inicia verificação contínua do status após o QR code ser exibido
              const statusCheck = setInterval(async () => {
                if (!isMounted.current) {
                  clearInterval(statusCheck);
                  return;
                }
                
                try {
                  const statusRes = await axios.get(`${baseUrl}/status/${sessionName}`);
                  if (statusRes.data.status === 'connected') {
                    clearInterval(statusCheck);
                    if (isMounted.current) {
                      console.log('Sessão conectada com sucesso!');
                      onSessionStatusChange('connected', sessionName);
                    }
                  }
                } catch (err) {
                  console.log('Aguardando conexão do WhatsApp...');
                }
              }, 3000);
            } else {
              clearInterval(intervalo);
            }
          } else {
            // QR code ainda não disponível
            console.log(`Tentativa ${tentativas + 1}/${maxTentativas}: QR Code ainda não disponível`);
            tentativas++;
          }
        } catch (err) {
          console.log(`Tentativa ${tentativas + 1}/${maxTentativas} de obter QR Code...`);
          tentativas++;
          
          if (tentativas >= maxTentativas) {
            clearInterval(intervalo);
            if (isMounted.current) {
              setLoading(false);
              onSessionStatusChange('disconnected');
              alert('O QR Code não foi gerado pelo servidor Venom após várias tentativas. Verifique se o servidor está funcionando corretamente.');
            }
          }
        }
      }, 3000); // Aumentando o intervalo para 3 segundos para dar mais tempo ao servidor
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      if (isMounted.current) {
        alert('Erro ao iniciar sessão: ' + (error.response?.data?.message || error.message));
        setLoading(false);
        onSessionStatusChange('disconnected');
      }
    }
  };

  // Função para desconectar a sessão
  const desconectarSessao = async () => {
    if (currentStatus !== 'connected') return;

    setLoading(true);
    try {
      const response = await axios.get(`${baseUrl}/logout/${sessionName}`);
      
      if (isMounted.current) {
        setQrCode(null);
        onSessionStatusChange('disconnected');
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      alert('Erro ao tentar desconectar.');
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <Phone className="text-green-500 mr-2" size={24} />
          <h2 className="text-xl font-semibold">Conexão WhatsApp</h2>
        </div>
        <div className="flex items-center">
          <span className="text-sm mr-2">Status:</span>
          {currentStatus === 'connected' ? (
            <span className="flex items-center text-green-600 font-medium">
              <CheckCircle size={16} className="mr-1" /> Conectado
            </span>
          ) : currentStatus === 'connecting' ? (
            <span className="flex items-center text-yellow-600 font-medium">
              <Loader size={16} className="mr-1 animate-spin" /> Conectando
            </span>
          ) : (
            <span className="flex items-center text-red-500 font-medium">
              <Slash size={16} className="mr-1" /> Desconectado
            </span>
          )}
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={iniciarSessao}
            disabled={currentStatus === 'connected' || loading || currentStatus === 'connecting'}
            className={`px-4 py-2 rounded-md font-medium flex items-center justify-center w-full md:w-auto
              ${currentStatus === 'connected' || currentStatus === 'connecting'
                ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                : loading
                  ? 'bg-blue-400 text-white cursor-wait'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
          >
            {loading ? (
              <>
                <Loader className="animate-spin mr-2" size={18} />
                Conectando...
              </>
            ) : currentStatus === 'connected' ? (
              <>
                <CheckCircle className="mr-2" size={18} />
                Conectado
              </>
            ) : (
              <>
                <Phone className="mr-2" size={18} />
                Conectar WhatsApp
              </>
            )}
          </button>

          <button
            onClick={desconectarSessao}
            disabled={loading || currentStatus !== 'connected'}
            className={`px-4 py-2 rounded-md font-medium flex items-center justify-center w-full md:w-auto
              ${loading || currentStatus !== 'connected'
                ? 'bg-red-400 text-white cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {loading && currentStatus === 'connected' ? (
              <>
                <Loader className="animate-spin mr-2" size={18} />
                Desconectando...
              </>
            ) : (
              <>
                <PhoneOff className="mr-2" size={18} />
                Desconectar
              </>
            )}
          </button>
        </div>
      </div>

      {loading && !qrCode && currentStatus !== 'connected' && (
        <div className="flex flex-col items-center justify-center p-4 border rounded-lg">
          <Loader className="animate-spin text-blue-500 mb-3" size={36} />
          <p className="text-gray-700 font-medium">Gerando QR Code pelo Venom, aguarde...</p>
          <p className="text-gray-500 text-sm mt-2">Este processo pode levar até 1 minuto</p>
        </div>
      )}

      {qrCode && currentStatus !== 'connected' && (
        <div className="flex flex-col items-center p-6 border rounded-lg bg-blue-50">
          <h4 className="text-lg font-medium mb-4 text-blue-800">Escaneie este QR Code:</h4>
          <div className="bg-white p-4 border-2 border-blue-300 rounded-lg mb-4 shadow-md">
            {/* Usar o QR code exatamente como fornecido pelo servidor, sem manipulação */}
            <img 
              src={qrCode} 
              alt="QR Code WhatsApp" 
              className="max-w-xs" 
              onError={(e) => {
                console.error("Erro ao carregar QR code");
                e.target.style.display = 'none';
                alert("Erro ao exibir o QR Code. Tente reiniciar a conexão.");
              }}
            />
          </div>
          <div className="text-sm text-gray-700 text-center max-w-sm">
            <p className="mb-2 font-medium">Instruções:</p>
            <ol className="list-decimal text-left pl-5 space-y-1">
              <li>Abra o WhatsApp no seu celular</li>
              <li>Toque em <b>Configurações</b></li>
              <li>Selecione <b>Dispositivos conectados</b></li>
              <li>Toque em <b>Conectar um dispositivo</b></li>
              <li>Posicione a câmera para escanear o QR Code acima</li>
            </ol>
            <p className="mt-3 text-xs text-blue-600">O QR Code expira após alguns minutos. Se expirar, reinicie o processo.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginSection;