import React, { useEffect, useState } from "react";
import { useStore } from "../Context/StoreContext";
import { IsLojaOpen } from "../../services/lojaService";
import axios from "axios";

const StoreInfo = () => {
  const { storeInfo } = useStore();
  const [lojaAberta, setLojaAberta] = useState(true);

  useEffect(() => {

    const nomeDaLoja = storeInfo?.nomeDaLoja;

    const fetchData = async () => {
      try {
        const restauranteIdResponse = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/1.0/restaurante/BuscarRestauranteIdPorNome/${nomeDaLoja}`
        );
        const restauranteId = restauranteIdResponse.data;
        localStorage.setItem("restauranteId", restauranteId);

        const lojaAbertaConsult = await IsLojaOpen(restauranteId);
        setLojaAberta(lojaAbertaConsult);
      } catch (error) {
        console.error("Erro ao verificar status da loja:", error);
      }
    };
    
    if (nomeDaLoja) {
      fetchData();
    }
  }, [storeInfo]); 

  if (!storeInfo || !storeInfo.empresa) {
    return (
      <div className="bg-white py-4 text-center text-sm text-gray-500">
        Carregando informações da loja...
      </div>
    );
  }

  // --- Passo 3: O resto da lógica de renderização ---
  const { nomeDaLoja, empresa } = storeInfo;

  const formatarHorario = (horario) => {
    if (!horario) return "N/A";
    const [hora, minuto] = horario.split(":");
    return `${parseInt(hora)}h${minuto !== "00" ? minuto : ""}`;
  };

  const horarioAbertura = formatarHorario(empresa.horarioAbertura);
  const horarioFechamento = formatarHorario(empresa.horarioFechamento);

  return (
    <div className="w-full bg-gray-900">
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
      {!lojaAberta && (
        <div className="w-full bg-red-100 text-red-700 text-center text-sm font-semibold py-2">
          A loja está fechada no momento.
        </div>
      )}
    </div>
  );
};

export default StoreInfo;