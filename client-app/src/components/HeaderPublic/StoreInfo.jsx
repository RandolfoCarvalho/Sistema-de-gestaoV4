import React from "react";
import { useStore } from "../Context/StoreContext";

const StoreInfo = () => {
    const { storeInfo } = useStore();
    if (!storeInfo) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                <h1 className="text-2xl font-semibold text-gray-700">Carregando informações da loja...</h1>
            </div>
        );
    }
    const { nomeDaLoja, empresa } = storeInfo;

    // Função para formatar o horário, removendo zeros desnecessários
    const formatarHorario = (horario) => {
        if (!horario) return "00:00";
        const [hora, minuto] = horario.split(":");
        return `${parseInt(hora)}h${minuto !== "00" ? minuto : ""}`;
    };

    const horarioAbertura = formatarHorario(empresa?.horarioAbertura);
    const horarioFechamento = formatarHorario(empresa?.horarioFechamento);

    // Função para verificar se a loja está aberta
    const lojaEstaAberta = () => {
        if (!empresa?.horarioAbertura || !empresa?.horarioFechamento) return false;

        const agora = new Date();
        const horaAtual = agora.getHours();
        const minutoAtual = agora.getMinutes();

        const [horaAbertura, minutoAbertura] = empresa.horarioAbertura.split(":").map(Number);
        const [horaFechamento, minutoFechamento] = empresa.horarioFechamento.split(":").map(Number);

        const horarioAtualEmMinutos = horaAtual * 60 + minutoAtual;
        const horarioAberturaEmMinutos = horaAbertura * 60 + minutoAbertura;
        const horarioFechamentoEmMinutos = horaFechamento * 60 + minutoFechamento;

        return horarioAtualEmMinutos >= horarioAberturaEmMinutos && horarioAtualEmMinutos < horarioFechamentoEmMinutos;
    };

    return (
        <>
            <div className="fixed top-16 w-full bg-white shadow-sm z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3">
                        <div className="text-sm text-gray-600">
                            Abre às {horarioAbertura} · Fecha às {horarioFechamento}
                        </div>
                        <div className="text-sm font-medium text-blue-500">
                            Perfil da loja - {nomeDaLoja}
                        </div>
                    </div>
                </div>
            </div>
            {/* Exibe a mensagem de "Loja fechada" apenas se a loja estiver fechada */}
            {!lojaEstaAberta() && (
            <div className="fixed top-28 w-full bg-red-50 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-2 text-center text-sm text-red-500">
                        Loja fechada, abre às {horarioAbertura}
                    </div>
                </div>
            </div>
        )}
            
        </>
    );
};

export default StoreInfo;
