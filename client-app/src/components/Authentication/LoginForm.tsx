// src/components/LoginForm.tsx
import * as React from "react";
import { User, Lock, AlertCircle } from "lucide-react";
import InputComIcone from "./InputComIcone";

interface LoginFormProps {
  userName: string;
  setUserName: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  error: string | null;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
}

const LoginForm: React.FC<LoginFormProps> = ({
  userName,
  setUserName,
  password,
  setPassword,
  error,
  handleSubmit,
  isLoading = false,
}) => {
  return (
    <div className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-8 text-center">
        <h2 className="text-2xl font-bold leading-9 tracking-tight text-gray-900">
          Acesse sua conta
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Bem-vindo de volta! Faça o login para continuar.
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <InputComIcone
          id="username"
          name="username"
          type="text"
          label="Nome de Usuário"
          placeholder="seu.usuario"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          icon={<User />}
          required
          disabled={isLoading}
        />

        <InputComIcone
          id="password"
          name="password"
          type="password"
          label="Senha"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock />}
          required
          disabled={isLoading}
        />

        {error && (
          <div 
            className="flex items-center gap-x-3 rounded-md bg-red-50 p-3 text-sm leading-6 text-red-700 border border-red-200"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
            <p>{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2.5 px-4 bg-indigo-600 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </button>
        </div>

        <div className="text-sm text-center">
          <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
            Esqueceu sua senha?
          </a>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;