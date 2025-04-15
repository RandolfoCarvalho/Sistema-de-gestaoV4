import React from "react";
import { User, Lock } from "lucide-react";

const LoginForm = ({ userName, setUserName, password, setPassword, error, handleSubmit }) => {
    return (
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Login</h2>
            </div>
            <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Campo UserName */}
                <div>
                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700">UserName</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="userName"
                            name="userName"
                            type="text"
                            required
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            placeholder="UserName"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />
                    </div>
                </div>

                {/* Campo Password */}
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {/* Mensagem de erro */}
                {error && <div className="text-red-600 text-sm mt-2">{error}</div>}

                {/* Botão de login */}
                <div>
                    <button type="submit" className="w-full flex justify-center py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        Entrar
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LoginForm;
