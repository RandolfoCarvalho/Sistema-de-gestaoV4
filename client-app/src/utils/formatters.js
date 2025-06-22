/**
 * Formata um valor de preço para ser enviado ao backend, usando ponto como separador decimal.
 * @param {string | number | null | undefined} preco
 * @returns {string | null}
 */
export function formatPriceToInvariantBackend(preco) {
  if (preco === null || preco === undefined || String(preco).trim() === '') {
    return null;
  }

  let valorStr = String(preco)
    .replace(/["']/g, '') 
    .replace(',', '.'); 

  if (isNaN(parseFloat(valorStr))) {
    console.warn(`formatPriceToInvariantBackend: Valor de preço inválido '${preco}' resultou em '${valorStr}', retornando null.`);
    return null;
  }

  return valorStr;
}

// Função auxiliar para formatar preço em Reais (BRL) - sem alterações
export function formatPrice(price) {
  const numericPrice = Number(price) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericPrice);
};
