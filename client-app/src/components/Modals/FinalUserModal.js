import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';

const FinalUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [isNomeRequired, setIsNomeRequired] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Efeito para limpar o estado quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setNome('');
            setTelefone('');
            setIsNomeRequired(false);
            setError('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleTelefoneChange = (e) => {
        setTelefone(e.target.value);
        // Se o usuário mexer no telefone, a verificação anterior pode não ser mais válida.
        if (isNomeRequired) {
            setIsNomeRequired(false);
        }
    };

    // A função onBlur agora só serve para UX, para mostrar o campo de nome.
    const handleTelefoneBlur = async () => {
        const telefoneNumerico = telefone.replace(/\D/g, '');
        if (telefoneNumerico.length !== 11) return;

        // Não precisa de loading aqui para não travar a UI
        try {
            // Verifica silenciosamente. Não faz login aqui.
            await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/login`, { Telefone: telefoneNumerico });
            setIsNomeRequired(false); // Garante que se o usuário existir, o campo nome não aparece
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setIsNomeRequired(true); // Usuário não existe, precisa de nome
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const telefoneNumerico = telefone.replace(/\D/g, '');

        if (!/^\d{11}$/.test(telefoneNumerico)) {
            setError('Formato de telefone inválido (DDD + 9 dígitos).');
            setLoading(false);
            return;
        }

        if (isNomeRequired && !nome.trim()) {
            setError('Por favor, informe seu nome para o cadastro.');
            setLoading(false);
            return;
        }

        try {
            let response;
            if (isNomeRequired) {
                // Cenário de REGISTRO
                response = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/register`, { 
                    Nome: nome, 
                    Telefone: telefoneNumerico 
                });
            } else {
                // Cenário de LOGIN
                response = await axios.post(`${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/login`, { 
                    Telefone: telefoneNumerico 
                });
            }
            
            // Se chegou aqui, a API retornou 200 (login) ou 201 (register)
            const userDataWithToken = response.data; // A resposta já contém id, nome, telefone e token

            if (onSuccess) {
                onSuccess(userDataWithToken); // Passa os dados JÁ AUTENTICADOS para o pai
            }
            
            // Não precisa mais chamar handleClose, o pai fará isso.

        } catch (err) {
            if (err.response && err.response.status === 404) {
                // Se o login falhou com 404, o onBlur pode ter falhado, então pedimos o nome
                setIsNomeRequired(true);
                setError('Parece que é sua primeira vez! Por favor, informe seu nome.');
            } else {
                 const errorMessage = err.response?.data?.message || 'Ocorreu um erro. Tente novamente.';
                 setError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    // handleClose foi simplificado, pois a limpeza de estado agora é feita pelo useEffect
    const handleClose = () => {
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={handleClose}
            shouldCloseOnOverlayClick={!loading}
            contentLabel="Identifique-se"
            className="bg-white p-6 rounded-lg shadow-xl max-w-md w-11/12 mx-auto my-20 focus:outline-none"
            overlayClassName="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
            appElement={document.getElementById('root') || undefined}
        >
            <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-800">Identifique-se para continuar</h2>
                    <button onClick={handleClose} className="text-gray-500 hover:text-gray-800" disabled={loading}>
                        ✕
                    </button>
                </div>

                <p className="text-gray-600 mb-6">
                    Para finalizar seu pedido, precisamos de algumas informações.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="telefone" className="block text-sm font-medium text-gray-700">
                            Número de WhatsApp (DDD + Número)
                        </label>
                        <input
                            type="tel"
                            id="telefone"
                            name="telefone"
                            value={telefone}
                            onChange={handleTelefoneChange}
                            onBlur={handleTelefoneBlur}
                            placeholder="Ex: 64992094652"
                            className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                            required
                            disabled={loading}
                        />
                    </div>

                    {isNomeRequired && (
                        <div className="animate-fade-in">
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                                Parece que é sua primeira vez! Qual seu nome?
                            </label>
                            <input
                                type="text"
                                id="nome"
                                name="nome"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Nome e Sobrenome"
                                className="mt-1 w-full p-3 border border-gray-300 rounded-md bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={loading}
                                autoFocus
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-red-600 text-sm text-center">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-md font-semibold text-white transition-colors duration-200 ${
                            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? 'Aguarde...' : 'Continuar'}
                    </button>
                </form>
            </div>
        </Modal>
    );
};

export default FinalUserModal;