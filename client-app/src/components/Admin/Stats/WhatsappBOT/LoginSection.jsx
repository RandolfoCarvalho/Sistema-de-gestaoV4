import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, CheckCircle, PhoneOff, Slash, AlertCircle, Send, Loader, AlertTriangle } from 'lucide-react';

// Componente de Login e QR Code
const LoginSection = ({ onSessionConnected }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('disconnected');
  const [sessionName, setSessionName]= useState(localStorage.getItem('restaurantName'));;
  const baseUrl = process.env.REACT_APP_WHATSAPPBOT_VPS;
  // Verificar status da sessão ao carregar o componente
  useEffect(() => {
  const setupSession = async () => {
    let name = localStorage.getItem('restaurantName');
    console.log('Nome do restaurante: ', name);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/GetRestauranteInfo`);
      console.log('Nome do restaurante1: ', res.data.restaurante.nomeDaLoja);
      localStorage.setItem('restaurantName', res.data.restaurante.nomeDaLoja);
      setSessionName(name);
    } catch (error) {
      console.error('Erro ao buscar o nome do restaurante:', error);
      return;
    }
    // Agora que temos o nome, verificamos o status da sessão
    await checkSessionStatus(name);
  };

  setupSession();
}, []);

  const checkSessionStatus = async () => {
    try {
      const res = await axios.get(`${baseUrl}/status/${sessionName}`);
      if (res.data.status === 'connected') {
        setSessionStatus('connected');
        onSessionConnected();
      }
    } catch (error) {
      console.log('Sessão não iniciada ou não encontrada');
    }
  };

  const iniciarSessao = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      await axios.post(`${baseUrl}/start-session`, {
        session: sessionName
      });

      // Polling até obter o QR Code (tenta a cada 2s por até 30s)
      let tentativas = 0;
      const maxTentativas = 15;
      const intervalo = setInterval(async () => {
        try {
          const res = await axios.get(`${baseUrl}/qrcode/${sessionName}`);
          
          if (res.data.qrCode) {
            clearInterval(intervalo);
            
            // Verifica se já contém o prefixo data:image
            const qrData = res.data.qrCode;
            if (qrData.startsWith('data:image')) {
              setQrCode(qrData);
            } else {
              setQrCode(`data:image/png;base64,${qrData}`);
            }
            
            setLoading(false);
            
            // Verificar status após escanear o QR code
            const statusCheck = setInterval(async () => {
              try {
                const statusRes = await axios.get(`${baseUrl}/status/${sessionName}`);
                if (statusRes.data.status === 'connected') {
                  setSessionStatus('connected');
                  clearInterval(statusCheck);
                  onSessionConnected(); // Notifica o componente pai
                }
              } catch (err) {
                console.log('Aguardando conexão...');
              }
            }, 3000);
          }
        } catch (err) {
          console.error("Erro ao buscar QR Code:", err);
          tentativas++;
          if (tentativas > maxTentativas) {
            clearInterval(intervalo);
            setLoading(false);
            alert('QR Code não retornado após múltiplas tentativas.');
          }
        }
      }, 2000);

    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      setLoading(false);
      alert(`Erro ao iniciar sessão: ${error.message}`);
    }
  };


  const desconectarSessao = async () => {
  setLoading(true);
  try {
    const response = await axios.get(`${baseUrl}/logout/${sessionName}`);
    console.log('Desconectado com sucesso:', response.data);

    setSessionStatus('disconnected');
    setQrCode(null);
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    // Aqui você pode setar erro para exibir no UI, se quiser
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center mb-4">
        <Phone className="text-green-500 mr-2" size={24} />
        <h2 className="text-xl font-semibold">Conexão WhatsApp</h2>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600 mb-2">
          Status: {' '}
          <span className={`font-medium ${sessionStatus === 'connected' ? 'text-green-500' : 'text-orange-500'}`}>
            {sessionStatus === 'connected' ? 'Conectado' : 'Desconectado'}
          </span>
        </p>
        
          <div className="flex space-x-4">
            <button 
              onClick={iniciarSessao} 
              disabled={sessionStatus === 'connected' || loading}
              className={`px-4 py-2 rounded-md font-medium flex items-center justify-center w-full md:w-auto
                ${sessionStatus === 'connected' 
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
              ) : sessionStatus === 'connected' ? (
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
              disabled={loading} // só desabilita se estiver carregando
              className={`px-4 py-2 rounded-md font-medium flex items-center justify-center w-full md:w-auto
                ${loading 
                  ? 'bg-red-400 text-white cursor-wait' 
                  : 'bg-red-600 hover:bg-red-700 text-white'}`}
            >
              {loading ? (
                <>
                  <Loader className="animate-spin mr-2" size={18} />
                  Desconectando...
                </>
              ) : sessionStatus === 'connected' ? (
                <>
                  <PhoneOff className="mr-2" size={18} />
                  Desconectar
                </>
              ) : (
                <>
                  <Slash className="mr-2" size={18} />
                  Forçar Desconexão
                </>
              )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-4">
          <Loader className="animate-spin text-blue-500 mb-2" size={32} />
          <p className="text-gray-600">Gerando QR Code, aguarde...</p>
        </div>
      )}

      {qrCode && sessionStatus !== 'connected' && (
        <div className="flex flex-col items-center p-4 border rounded-lg">
          <h4 className="text-lg font-medium mb-3">Escaneie o QR Code:</h4>
          <div className="bg-white p-3 border rounded-lg mb-3">
            <img 
              src={qrCode} 
              alt="QR Code para WhatsApp" 
              className="max-w-xs"
            />
          </div>
          <p className="text-sm text-gray-500 text-center">
            Abra o WhatsApp no seu celular, vá em Configurações &gt; Dispositivos conectados &gt; Conectar um dispositivo
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginSection;