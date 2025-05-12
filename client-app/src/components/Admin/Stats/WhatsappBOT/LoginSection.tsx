import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, CheckCircle, PhoneOff, Slash, Loader } from 'lucide-react';

interface LoginSectionProps {
  onSessionConnected: () => void;
  onSessionDisconnected?: () => void;
}

const LoginSection: React.FC<LoginSectionProps> = ({ onSessionConnected, onSessionDisconnected }) => {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [sessionName, setSessionName] = useState('');

  const baseUrl = process.env.REACT_APP_WHATSAPPBOT_VPS;

  // Initialize session on component mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        // Get restaurant name from localStorage first
        let name = localStorage.getItem('restaurantName');
        
        // If not in localStorage, fetch from API
        if (!name) {
          try {
            const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/1.0/Restaurante/GetRestauranteInfo`);
            name = res.data.restaurante.nomeDaLoja;
            localStorage.setItem('restaurantName', name);
          } catch (error) {
            console.error('Error fetching restaurant name:', error);
          }
        }
        
        if (name) {
          setSessionName(name);
          // Check initial session status
          await checkSessionStatus(name);
        }
      } catch (error) {
        console.error('Error initializing session:', error);
      }
    };

    initializeSession();
  }, []);

  const checkSessionStatus = async (name?: string) => {
    const sessionToCheck = name || sessionName;
    try {
      const res = await axios.get(`${baseUrl}/status/${sessionToCheck}`);
      if (res.data.status === 'connected') {
        setSessionStatus('connected');
        onSessionConnected();
      } else {
        setSessionStatus('disconnected');
      }
    } catch (error) {
      console.log('Session not started or not found');
      setSessionStatus('disconnected');
    }
  };

  const startSession = async () => {
    setLoading(true);
    setQrCode(null);
    try {
      // Start session
      await axios.post(`${baseUrl}/start-session`, {
        session: sessionName
      });

      // Poll for QR Code
      const qrCodeInterval = setInterval(async () => {
        try {
          const res = await axios.get(`${baseUrl}/qrcode/${sessionName}`);
          
          if (res.data.qrCode) {
            clearInterval(qrCodeInterval);
            
            // Ensure QR code has data URI prefix
            const qrData = res.data.qrCode.startsWith('data:image') 
              ? res.data.qrCode 
              : `data:image/png;base64,${res.data.qrCode}`;
            
            setQrCode(qrData);
            setLoading(false);

            // Check connection status
            const statusCheckInterval = setInterval(async () => {
              try {
                const statusRes = await axios.get(`${baseUrl}/status/${sessionName}`);
                if (statusRes.data.status === 'connected') {
                  clearInterval(statusCheckInterval);
                  setSessionStatus('connected');
                  onSessionConnected();
                }
              } catch (err) {
                console.log('Waiting for connection...');
              }
            }, 3000);
          }
        } catch (err) {
          console.error("Error fetching QR Code:", err);
          setLoading(false);
        }
      }, 2000);

    } catch (error) {
      console.error('Error starting session:', error);
      setLoading(false);
      alert(`Error starting session: ${error.message}`);
    }
  };

  const disconnectSession = async () => {
    setLoading(true);
    try {
      // Always attempt to disconnect even if the session might not exist
      await axios.get(`${baseUrl}/logout/${sessionName}`);
      console.log('Disconnect request sent');
      
      // Reset state regardless of server response
      setSessionStatus('disconnected');
      setQrCode(null);
      onSessionDisconnected?.();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, still update the UI to show disconnected
      setSessionStatus('disconnected');
      setQrCode(null);
      onSessionDisconnected?.();
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
            onClick={startSession} 
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
            onClick={disconnectSession} 
            disabled={loading}
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
              alt="WhatsApp QR Code" 
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