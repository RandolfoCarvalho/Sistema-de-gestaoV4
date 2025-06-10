export const slugify = (text) => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD') // Separa acentos dos caracteres
    .replace(/[\u0300-\u036f]/g, '') // Remove os acentos
    .replace(/\s+/g, '-') // Substitui espaços por -
    .replace(/[^\w-]+/g, '') // Remove caracteres não-alfanuméricos (exceto -)
    .replace(/--+/g, '-'); // Substitui múltiplos - por um único -
};