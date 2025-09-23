// src/hooks/useCadastro.js
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../Context/StoreContext";
import { useAuth } from "../../../services/AuthContext";

const useCadastro = () => {
  const [userName, setUserName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [nomeDaLoja, setNomeDaLoja] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setCurrentStore } = useStore();
  const { setIsAuthenticated } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/1.0/restaurante/cadastro`,
        {
          userName,
          phoneNumber,
          emailAddress,
          nomeDaLoja,
          password,
        },
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        const { accessToken, storeName } = response.data;

        localStorage.setItem("token", accessToken);
        axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

        setCurrentStore(storeName);
        localStorage.setItem("currentStore", storeName);
        setIsAuthenticated(true);

        // limpa os campos
        setUserName("");
        setPhoneNumber("");
        setEmailAddress("");
        setNomeDaLoja("");
        setPassword("");

        navigate("/auth/login", {
          state: { successMessage: "Cadastro feito com sucesso. Faça login." },
        });
      } else {
        setError("Ocorreu um erro desconhecido. Tente novamente.");
      }
    } catch (err) {
        console.error("Erro no cadastro:", err);

        if (err.response) {
          const msg =
            err.response.data?.message ||
            err.response.data?.title ||
            "Erro inesperado no servidor.";
          setError(msg);
        } else {
          setError("Não foi possível conectar ao servidor. Verifique sua conexão.");
        }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userName,
    setUserName,
    phoneNumber,
    setPhoneNumber,
    emailAddress,
    setEmailAddress,
    nomeDaLoja,
    setNomeDaLoja,
    password,
    setPassword,
    error,
    handleSubmit,
    isLoading,
  };
};

export default useCadastro;
