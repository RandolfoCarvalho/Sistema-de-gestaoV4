import React from 'react';
import { useStore } from '../Context/StoreContext';
import { Clock, MapPin, Phone, Calendar, Info } from 'lucide-react';
import BottomNav from '@/components/ui/BottomNav';
import PerfilLojaSkeleton from '../ui/skeleton/PerfilLojaSkeleton';

const InfoItem = ({ icon: Icon, title, children }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 mt-1">
            <Icon className="w-5 h-5 text-blue-500" />
        </div>
        <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">{title}</h3>
            <div className="text-base text-gray-800 dark:text-gray-200">{children}</div>
        </div>
    </div>
);

const PerfilLoja = () => {
    // Pega as informações da loja do seu contexto
    const { storeInfo } = useStore();
    if (!storeInfo || !storeInfo.empresa) {
        return <PerfilLojaSkeleton />;
    }
    // --- Desestruturando os dados REAIS do seu objeto storeInfo ---
    const { empresa, imagemUrl, phoneNumber } = storeInfo;
    const { 
        nomeFantasia, 
        endereco, 
        bairro, 
        cidade, 
        estado, 
        cep, 
        horarioAbertura, 
        horarioFechamento, 
        diasFuncionamento,
        observacoes 
    } = empresa;
    const fullAddress = `${endereco}, ${bairro}, ${cidade} - ${estado}, ${cep}`;
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;
    const whatsappUrl = `https://wa.me/${phoneNumber}`;
    const diasDaSemana = {
        segunda: "Seg", terca: "Ter", quarta: "Qua", quinta: "Qui",
        sexta: "Sex", sabado: "Sáb", domingo: "Dom"
    };
    const diasAtivos = Object.entries(diasFuncionamento || {})
        .filter(([_, ativo]) => ativo)
        .map(([dia]) => diasDaSemana[dia])
        .join(' - ');

    return (
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pb-20">
            <div className="max-w-md mx-auto">
                {/* --- Header com Logo e Nome --- */}
                <div className="p-6 bg-white dark:bg-gray-800 shadow-lg rounded-b-3xl">
                    <img
                        src={imagemUrl} 
                        alt={`Logo da ${nomeFantasia}`} 
                        className="w-28 h-28 rounded-full mx-auto object-cover border-4 border-gray-200 dark:border-gray-700 -mb-14 shadow-md"
                    />
                </div>

                <div className="pt-20 px-6 pb-6 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        {nomeFantasia}
                    </h1>
                </div>

                {/* --- Corpo com as Informações --- */}
                <div className="px-4 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-4">
                        {observacoes && (
                             <InfoItem icon={Info} title="Sobre nós">
                                <p className="italic">{observacoes}</p>
                            </InfoItem>
                        )}
                        <InfoItem icon={Calendar} title="Funcionamento">
                            <p>{diasAtivos || "Consulte-nos"}</p>
                        </InfoItem>

                        <InfoItem icon={Clock} title="Horário">
                            <p>
                                {(horarioAbertura || '00:00:00').slice(0, 5)} 
                                {' às '} 
                                {(horarioFechamento || '00:00:00').slice(0, 5)}
                            </p>
                        </InfoItem>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 space-y-4">
                         <InfoItem icon={MapPin} title="Endereço">
                            <p>{fullAddress}</p>
                        </InfoItem>
                        <a
                            href={googleMapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors duration-300"
                        >
                            <MapPin className="w-5 h-5 mr-2" />
                            Ver no mapa
                        </a>
                    </div>

                     <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                        <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors duration-300"
                        >
                            <Phone className="w-5 h-5 mr-2" />
                            Chamar no WhatsApp
                        </a>
                    </div>
                </div>
            </div>
            <BottomNav />
        </div>
    );
};

export default PerfilLoja;