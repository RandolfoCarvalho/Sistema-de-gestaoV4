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
      const maxTentativas = 15;

      // Pooling para obter o QR Code
      const intervalo = setInterval(async () => {
        if (!isMounted.current) {
          clearInterval(intervalo);
          return;
        }
        
        try {
          const res = await axios.get(`${baseUrl}/qrcode/${sessionName}`);
          if (res.data.qrCode) {
            clearInterval(intervalo);

            // Formata o QR code adequadamente
            const qrData = res.data.qrCode.startsWith('data:image')
              ? res.data.qrCode
              : `data:image/png;base64,${res.data.qrCode}`;

            if (isMounted.current) {
              setQrCode(qrData);
              setLoading(false);
            }

            // Verificação contínua do status após QR code gerado
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
                    onSessionStatusChange('connected', sessionName);
                  }
                }
              } catch (err) {
                console.log('Aguardando conexão...');
              }
            }, 3000);
          }
        } catch (err) {
          tentativas++;
          if (tentativas >= maxTentativas) {
            clearInterval(intervalo);
            if (isMounted.current) {
              setLoading(false);
              onSessionStatusChange('disconnected');
              alert('QR Code não foi carregado após várias tentativas.');
            }
          }
        }
      }, 2000);
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      if (isMounted.current) {
        alert('Erro ao iniciar sessão.');
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
        <div className="flex flex-col items-center justify-center p-4">
          <Loader className="animate-spin text-blue-500 mb-2" size={32} />
          <p className="text-gray-600">Gerando QR Code, aguarde...</p>
        </div>
      )}

      {qrCode && currentStatus !== 'connected' && (
        <div className="flex flex-col items-center p-4 border rounded-lg">
          <h4 className="text-lg font-medium mb-3">Escaneie o QR Code:</h4>
          <div className="bg-white p-3 border rounded-lg mb-3">
            <img src={qrCode} alt="QR Code para WhatsApp" className="max-w-xs" />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Abra o WhatsApp no seu celular, vá em <b>Configurações &gt; Dispositivos conectados &gt; Conectar um dispositivo</b>
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginSection;