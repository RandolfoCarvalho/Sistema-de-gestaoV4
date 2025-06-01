//Funções auxiliares referentes a loja:


export const IsLojaOpen = async (restauranteId) => {
  const url = `${process.env.REACT_APP_API_URL}/api/1.0/restaurante/isLojaOpen/${restauranteId}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Erro ao verificar status da loja");
  const data = await response.json();
  return data.isOpen;
};


