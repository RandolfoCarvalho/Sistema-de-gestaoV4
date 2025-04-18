import { useState, useEffect } from 'react';

const FuturisticLoadingSpinner = ({ 
  message = "Processando pagamento...",
  accentColor = "indigo",
  secondaryColor = "sky",
  darkMode = false,
  phaseMessages = [
    "Inicializando sistema",
    "Verificando credenciais",
    "Processando transação",
    "Finalizando operação"
  ],
  showBorder = true // Adiciona parâmetro para controlar se vai mostrar bordas ou só a bolinha girando
}) => {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);
  
  // Controla o progresso e as fases da animação
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 0.5;
      });
    }, 50);
    
    const phaseInterval = setInterval(() => {
      setPhase(prev => (prev + 1) % phaseMessages.length); // Usa as mensagens personalizadas
    }, 1500);
    
    return () => {
      clearInterval(progressInterval);
      clearInterval(phaseInterval);
    };
  }, [phaseMessages]);

  // Cores baseadas no modo escuro ou claro
  const bgColor = darkMode ? "bg-gray-900" : "bg-white";
  const textColor = darkMode ? "text-gray-200" : "text-gray-800";
  const overlayColor = darkMode ? "bg-black bg-opacity-80" : "bg-gray-50 bg-opacity-90";
  
  return (
    <div className={`fixed inset-0 ${overlayColor} backdrop-blur-sm flex items-center justify-center z-50`}>
      <div className={`max-w-sm w-full p-8 ${bgColor} shadow-xl relative overflow-hidden ${showBorder ? `rounded-2xl border border-${secondaryColor}-100` : ''}`}>
        {/* Barra de progresso superior */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className={`h-0.5 bg-gradient-to-r from-${accentColor}-400 to-${secondaryColor}-400`} 
            style={{ width: `${progress}%`, transition: 'width 0.3s ease-out' }}
          />
        </div>
        
        {/* Elemento decorativo */}
        <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-gradient-to-bl from-${secondaryColor}-200 to-transparent opacity-20" />
        
        <div className="space-y-8">
          {/* Spinner principal */}
          <div className="flex justify-center">
            <div className="relative w-24 h-24">
              {/* Anel externo pulsante */}
              {showBorder && (
                <div className={`absolute inset-0 rounded-full border border-${accentColor}-200 opacity-50 animate-ping`} />
              )}
              
              {/* Anel rotativo */}
              <div className={`absolute inset-0 rounded-full border-2 border-${accentColor}-400 border-t-transparent border-l-transparent animate-spin`} />
              
              {/* Círculo central */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-${accentColor}-400 to-${secondaryColor}-500 shadow-lg flex items-center justify-center">
                {/* Elemento interno pulsante */}
                <div className={`w-6 h-6 rounded-full bg-white opacity-80 animate-pulse`} />
              </div>
              
              {/* Elementos decorativos orbitais */}
              <div className={`absolute w-full h-full animate-spin`} style={{animationDuration: '8s'}}>
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-${secondaryColor}-300`} />
              </div>
              
              <div className={`absolute w-full h-full animate-spin`} style={{animationDuration: '12s', animationDirection: 'reverse'}}>
                <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-${accentColor}-300`} />
              </div>
            </div>
          </div>

          {/* Mensagem principal com animação sutil de fade */}
          <div className="text-center space-y-2">
            <p className={`${textColor} text-sm font-medium tracking-wide uppercase`}>
              {message}
            </p>
            
            {/* Fases de mensagem que alternam */}
            <div className="h-5 overflow-hidden">
              <div className="transition-transform duration-500 ease-in-out" 
                   style={{ transform: `translateY(-${phase * 20}px)` }}>
                {phaseMessages.map((msg, idx) => (
                  <p key={idx} className={`text-${accentColor}-400 text-xs h-5 flex items-center justify-center`}>
                    {msg}
                  </p>
                ))}
              </div>
            </div>
          </div>
          
          {/* Indicadores de etapas */}
          <div className="flex justify-center space-x-1">
            {[...Array(phaseMessages.length)].map((_, idx) => (
              <div 
                key={idx} 
                className={`w-8 h-0.5 rounded-full transition-colors duration-300 ${idx <= phase ? `bg-${accentColor}-400` : 'bg-gray-200'}`} 
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturisticLoadingSpinner;
