import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap } from 'lucide-react';

const AuthenticationTransition = () => {
    const [stage, setStage] = useState('preparing');
    const navigate = useNavigate();

    useEffect(() => {
        const preparationTimer = setTimeout(() => {
            setStage('launching');
        }, 1000);

        const navigationTimer = setTimeout(() => {
            navigate('/Gestao/MinhaLoja');
        }, 2500);

        return () => {
            clearTimeout(preparationTimer);
            clearTimeout(navigationTimer);
        };
    }, [navigate]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black">
            <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A2E] via-[#16213E] to-[#0F3460] opacity-90"></div>

            <div className={`relative z-60 w-96 h-96 rounded-full 
                transform transition-all duration-1000 ease-in-out
                ${stage === 'preparing' ? 'scale-50 opacity-0' :
                    stage === 'launching' ? 'scale-150 opacity-100' : ''}`}>

                <div className="absolute inset-0 bg-white/5 backdrop-blur-md rounded-full 
                    flex items-center justify-center border-2 border-[#0F3460]">

                    {stage === 'preparing' && (
                        <div className="text-center text-white animate-pulse">
                            <Check className="w-24 h-24 mx-auto mb-4 text-blue-500" />
                            <p className="text-2xl font-bold text-blue-400">Verificando</p>
                        </div>
                    )}

                    {stage === 'launching' && (
                        <div className="text-center text-white">
                            <Zap className="w-32 h-32 mx-auto mb-4 text-yellow-500 animate-bounce" />
                            <p className="text-3xl font-extrabold tracking-wider text-yellow-400">
                                Conectado
                            </p>
                            <p className="text-sm mt-2 opacity-75 text-blue-300">
                                Entrando no Sistema
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r 
                    from-[#0F3460]/30 to-[#16213E]/30 animate-pulse 
                    mix-blend-overlay"></div>
            </div>
        </div>
    );
};

export default AuthenticationTransition;