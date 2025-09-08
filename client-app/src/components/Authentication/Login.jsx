import React from "react";
import LoginForm from "./LoginForm";
import useAuthentication from "./hooks/useAuthentication";

const Login = () => {
    const { userName, setUserName, password, setPassword, error, handleSubmit, isLoading } = useAuthentication();
  
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <LoginForm
                    userName={userName}
                    setUserName={setUserName}
                    password={password}
                    setPassword={setPassword}
                    error={error}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading} 
                />
            </div>
        </div>
    );
};
export default Login;