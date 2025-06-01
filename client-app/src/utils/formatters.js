/**
 * Formata um valor de preço para ser enviado ao backend, usando ponto como separador decimal.
 * @param {string | number | null | undefined} preco O valor do preço.
 * @returns {string | null} O preço formatado como string, ou null se inválido/nulo.
 */
export function formatPriceToInvariantBackend(preco) {
  if (preco === null || preco === undefined || String(preco).trim() === '') {
    return null;
  }

  let valorStr = String(preco)
    .replace(/["']/g, '')     // Remove todas as aspas simples e duplas
    .replace(',', '.');       // Substitui vírgula por ponto

  if (isNaN(parseFloat(valorStr))) {
    console.warn(`formatPriceToInvariantBackend: Valor de preço inválido '${preco}' resultou em '${valorStr}', retornando null.`);
    return null;
  }

  return valorStr;
}
