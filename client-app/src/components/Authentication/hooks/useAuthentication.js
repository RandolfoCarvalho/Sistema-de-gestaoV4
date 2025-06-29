import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../Context/StoreContext";
import { useAuth } from "../../../services/AuthContext";

const useAuthentication = () => {
    const [userName, setUserName] = useState("");
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
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Auth/Signin`, { userName, password }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
            });

            if (response.status === 200) {
                const { accessToken, storeName } = response.data;

                localStorage.setItem("token", accessToken);
                axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

                setCurrentStore(storeName); 
                localStorage.setItem("currentStore", storeName);
                setIsAuthenticated(true); 
                setUserName("");
                setPassword("");

                navigate("/admin");
            } else {
                setError("Ocorreu um erro desconhecido. Tente novamente.");
            }
        } catch (err) {
            console.error("Erro no login:", err);
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message);
            } else if (err.response && err.response.status === 401) {
                setError("Credenciais inválidas. Por favor, tente novamente.");
            } else {
                setError("Não foi possível conectar ao servidor. Verifique sua conexão.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return { userName, setUserName, password, setPassword, error, handleSubmit, isLoading };
};

export default useAuthentication;