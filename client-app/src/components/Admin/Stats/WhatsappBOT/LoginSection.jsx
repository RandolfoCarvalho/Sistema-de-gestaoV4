import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Phone, CheckCircle, PhoneOff, Slash, Loader } from 'lucide-react';

const LoginSection = ({ onSessionConnected }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState('disconnected');
  const [sessionName, setSessionName] = useState('');
  const baseUrl = process.env.REACT_APP_WHATSAPPBOT_VPS;
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const setupSession = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/GetRestauranteInfo`);
        const name = res.data.restaurante.nomeDaLoja;
        localStorage.setItem('restaurantName', name);
        setSessionName(name);
        await checkSessionStatus(name);
      } catch (error) {
        console.error('Erro ao buscar nome do restaurante:', error);
      }
    };

    setupSession();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkSessionStatus = async (name) => {
    try {
      const res = await axios.get(`${baseUrl}/status/${name}`);
      if (res.data.status === 'connected') {
        if (isMounted.current) {
          setSessionStatus('connected');
          onSessionConnected();
        }
      }
    } catch (error) {
      console.log('Sessão não encontrada ou desconectada.');
    }
  };

  const iniciarSessao = async () => {
    setLoading(true);
    setQrCode(null);

    try {
      await axios.post(`${baseUrl}/start-session`, { session: sessionName });

      let tentativas = 0;
      const maxTentativas = 15;

      const intervalo = setInterval(async () => {
        try {
          const res = await axios.get(`${baseUrl}/qrcode/${sessionName}`);
          if (res.data.qrCode) {
            clearInterval(intervalo);

            const qrData = res.data.qrCode.startsWith('data:image')
              ? res.data.qrCode
              : `data:image/png;base64,${res.data.qrCode}`;

            if (isMounted.current) {
              setQrCode(qrData);
              setLoading(false);
            }

            // Verifica status de conexão após o QR ser escaneado
            const statusCheck = setInterval(async () => {
              try {
                const statusRes = await axios.get(`${baseUrl}/status/${sessionName}`);
                if (statusRes.data.status === 'connected') {
                  clearInterval(statusCheck);
                  if (isMounted.current) {
                    setSessionStatus('connected');
                    onSessionConnected();
                  }
                }
              } catch {
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
      }
    }
  };

const desconectarSessao = async () => {
  if (sessionStatus !== 'connected') return;

  setLoading(true);
  try {
    const response = await axios.get(`${baseUrl}/logout/${sessionName}`);

    // Aqui verificamos se a sessão já estava desconectada
    if (response.data.message === 'Sessão já desconectada ou não encontrada.') {
      setSessionStatus('disconnected'); // Atualiza o status no frontend
      setQrCode(null); // Limpa o QR Code
    } else {
      setSessionStatus('disconnected'); // Caso contrário, desconectou com sucesso
      setQrCode(null); // Limpa o QR Code
    }
  } catch (error) {
    console.error('Erro ao desconectar:', error);
    alert('Erro ao tentar desconectar.');
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
          Status:{' '}
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
            disabled={loading || sessionStatus !== 'connected'}
            className={`px-4 py-2 rounded-md font-medium flex items-center justify-center w-full md:w-auto
              ${loading || sessionStatus !== 'connected'
                ? 'bg-red-400 text-white cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700 text-white'}`}
          >
            {loading ? (
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

      {loading && !qrCode && (
        <div className="flex flex-col items-center justify-center p-4">
          <Loader className="animate-spin text-blue-500 mb-2" size={32} />
          <p className="text-gray-600">Gerando QR Code, aguarde...</p>
        </div>
      )}

      {qrCode && sessionStatus !== 'connected' && (
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
