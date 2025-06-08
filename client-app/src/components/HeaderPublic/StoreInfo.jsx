import React from "react";
import { useStore } from "../Context/StoreContext";

const StoreInfo = () => {
    const { storeInfo } = useStore();

    // O estado de carregamento pode ser mais simples
    if (!storeInfo) {
        return (
            <div className="bg-white py-4 text-center text-sm text-gray-500">
                Carregando...
            </div>
        );
    }
    const { nomeDaLoja, empresa } = storeInfo;

    const formatarHorario = (horario) => {
        if (!horario) return "N/A";
        const [hora, minuto] = horario.split(":");
        return `${parseInt(hora)}h${minuto !== "00" ? minuto : ""}`;
    };

    const horarioAbertura = formatarHorario(empresa?.horarioAbertura);
    const horarioFechamento = formatarHorario(empresa?.horarioFechamento);

    const lojaEstaAberta = () => {
        if (!empresa?.horarioAbertura || !empresa?.horarioFechamento) return false;
        const agora = new Date();
        const horaAtual = agora.getHours() * 60 + agora.getMinutes();
        const [hA, mA] = empresa.horarioAbertura.split(":").map(Number);
        const [hF, mF] = empresa.horarioFechamento.split(":").map(Number);
        const horarioAberturaEmMinutos = hA * 60 + mA;
        const horarioFechamentoEmMinutos = hF * 60 + mF;
        return horaAtual >= horarioAberturaEmMinutos && horaAtual < horarioFechamentoEmMinutos;
    };

    const estaAberta = lojaEstaAberta();

    // Agora, o componente retorna um bloco simples de divs, sem 'fixed'
    return (
        <div className="w-full bg-gray-900 ">
            {/* Barra de horário principal */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between py-3">
                    <div className="text-sm text-white">
                        Abre às {horarioAbertura} · Fecha às {horarioFechamento}
                    </div>
                    <div className="text-sm font-medium text-white">
                        Perfil da loja - {nomeDaLoja}
                    </div>
                </div>
            </div>
            {/* Mensagem de "Loja fechada" condicional */}
            {!estaAberta && (
                <div className="w-full bg-red-100 text-red-700 text-center text-sm font-semibold py-2">
                    A loja está fechada no momento.
                </div>
            )}
        </div>
    );
};

export default StoreInfo;