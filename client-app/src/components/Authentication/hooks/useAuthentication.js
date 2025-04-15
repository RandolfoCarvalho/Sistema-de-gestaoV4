import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const useAuthentication = () => {
    const [userName, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/Auth/Signin`, { userName, password }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true
            });

            if (response.status === 200) {
                const token = response.data.accessToken;
                localStorage.setItem("token", token);
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
                navigate("/admin");
            }
        } catch (err) {
            setError("Credenciais inválidas. Por favor, tente novamente.");
        }
    };

    return { userName, setUserName, password, setPassword, error, handleSubmit };
};

export default useAuthentication;
