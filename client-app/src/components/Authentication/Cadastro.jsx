import CadastroForm from "./CadastroForm";
import useCadastro from "./hooks/useCadastro";

const Cadastro = () => {
  const {
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
  } = useCadastro();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <CadastroForm
          userName={userName}
          setUserName={setUserName}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          emailAddress={emailAddress}
          setEmailAddress={setEmailAddress}
          nomeDaLoja={nomeDaLoja}
          setNomeDaLoja={setNomeDaLoja}
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

export default Cadastro;
