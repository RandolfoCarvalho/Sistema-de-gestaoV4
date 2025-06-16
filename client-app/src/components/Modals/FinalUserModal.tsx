import React, { useState } from 'react';
import ReactModal from 'react-modal';
import axios, { AxiosError } from 'axios'; // Importe AxiosError para tipar o erro
import { ArrowLeft } from 'lucide-react';

// 1. Definindo a interface para as props do componente
interface FinalUserModalProps {
  isOpen: boolean;
  onClose: () => void; 
  onSuccess: (data: any) => void;
}

interface FormDataState {
  nome: string;
  telefone: string;
  dataCriacao: string;
}

// 3. Use React.FC (Functional Component) e passe a interface das props
const FinalUserModal: React.FC<FinalUserModalProps> = ({ isOpen, onClose, onSuccess }) => {
  // 4. Tipando o estado
  const [formData, setFormData] = useState<FormDataState>({
    nome: '',
    telefone: '',
    dataCriacao: new Date().toISOString()
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // 5. Tipando o evento do 'onChange'
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 6. Tipando o evento do 'onSubmit'
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const telefoneNumerico = formData.telefone.replace(/\D/g, '');
    if (!/^\d{11}$/.test(telefoneNumerico)) {
      setError('Número de telefone inválido. Use o formato (DDD) 9XXXXXXXX.');
      setLoading(false);
      return;
    }
    const sanitizedData = {
      ...formData,
      telefone: telefoneNumerico
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/1.0/FinalUserAuth/VerificarTelefone`,
        sanitizedData
      );

      if (response.data) {
        localStorage.setItem("userId", response.data.id);
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("FinalUserTelefone", response.data.telefone);
        localStorage.setItem("FinalUserName", response.data.nome);
        onSuccess({
          ...response.data,
          FinalUserName: response.data.nome,
          FinalUserTelefone: response.data.telefone
        });
      } else {
        setError('Erro ao cadastrar usuário. Tente novamente.');
      }
    } catch (err) {
      // 7. Tipando o erro do catch de forma segura
      if (axios.isAxiosError(err)) {
        const axiosError = err as AxiosError<any>;
        setError(axiosError.response?.data?.message || 'Erro de comunicação com o servidor.');
      } else {
        setError('Ocorreu um erro inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <ReactModal
      isOpen={isOpen}
      onRequestClose={onClose} // Agora você pode usar o onClose aqui também
      shouldCloseOnOverlayClick={true} // Permitir fechar ao clicar fora
      contentLabel="Identifique-se"
      className="bg-white p-6 rounded-lg max-w-md mx-auto mt-20 focus:outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
            <div className="space-y-4">
                <div className="flex items-center space-x-4 mb-6">
                    <button
                        onClick={onClose}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="text-xl font-medium">Identifique-se</h2>
                </div>
                <div> <h1 className="text-xl font-medium">Finalize seu pedido em instantes</h1> </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="telefone" className="block text-sm font-medium">
                            Seu número de WhatsApp é:
                        </label>
                        <input
                            type="tel"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            placeholder="(__) _____-____"
                            className="w-full p-2 border rounded-md bg-gray-50"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="nome" className="block text-sm font-medium">
                            Seu nome e sobrenome:
                        </label>
                        <input
                            type="text"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleChange}
                            placeholder="Nome e sobrenome"
                            className="w-full p-2 border rounded-md bg-gray-50"
                            required
                        />
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-md text-center ${loading
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                            }`}
                    >
                        {loading ? 'Aguarde...' : 'Avançar'}
                    </button>

                    <p className="text-sm text-center text-gray-600">
                        Para realizar seu pedido vamos precisar de suas informações, este é um ambiente protegido.
                    </p>
                </form>
            </div>
        </ReactModal>
    );
};

export default FinalUserModal;