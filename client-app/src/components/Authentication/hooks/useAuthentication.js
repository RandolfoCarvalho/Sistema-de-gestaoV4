import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../Context/StoreContext";

const useAuthentication = () => {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();
    const { setCurrentStore } = useStore(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Auth/Signin`, { userName, password }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
            });
            if (response.status === 200) {
                // 3. Desestruture a nova resposta do backend
                const { accessToken, storeName } = response.data;

                // Armazene o token como antes
                localStorage.setItem("token", accessToken);
                axios.defaults.headers.common["Authorization"] = `Bearer ${accessToken}`;

                // 4. Defina a loja atual no contexto global
                setCurrentStore(storeName); 
                
                // Opcional, mas recomendado: persistir o nome da loja no localStorage também
                localStorage.setItem("currentStore", storeName);

                navigate("/admin");
            }
        } catch (err) {
            setError("Credenciais inválidas. Por favor, tente novamente.");
        }
    };
    return { userName, setUserName, password, setPassword, error, handleSubmit };
};

export default useAuthentication;