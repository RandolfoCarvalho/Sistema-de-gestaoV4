/**
 * Valida o objeto de endereço.
 * @param {object} endereco - O objeto de endereço do formulário.
 * @param {string[]} errors - O array de erros para adicionar novas mensagens.
 */
const validateAddress = (endereco, errors) => {
    const requiredFields = {
        Logradouro: 'A rua/avenida é obrigatória.',
        Numero: 'O número do endereço é obrigatório.',
        Bairro: 'O bairro é obrigatório.',
        Cidade: 'A cidade é obrigatória.',
        CEP: 'O CEP é obrigatório.'
    };

    for (const field in requiredFields) {
        if (!endereco?.[field]?.trim()) {
            errors.push(requiredFields[field]);
        }
    }

    const cepRegex = /^\d{5}-?\d{3}$/;
    if (endereco?.CEP && !cepRegex.test(endereco.CEP)) {
        errors.push("O formato do CEP é inválido (ex: 12345-678).");
    }
};

/**
 * Valida o formulário completo de checkout.
 * Esta função NÃO mostra alertas, apenas retorna o resultado da validação.
 * @param {object} formData - O estado completo do formulário.
 * @param {string} tipoEntrega - O tipo de entrega ('DELIVERY' ou 'RETIRADA').
 * @returns {{isValid: boolean, errors: string[]}} - Um objeto com o status da validação e uma lista de mensagens de erro.
 */
export const validateForm = (formData, tipoEntrega) => {
    const errors = [];

    // 1. Valida o endereço APENAS se o tipo de entrega for 'DELIVERY'
    if (tipoEntrega === 'DELIVERY') {
        validateAddress(formData.endereco, errors);
    }

    // 2. Valida se uma forma de pagamento foi selecionada
    if (!formData.pagamento?.FormaPagamento) {
        errors.push("A forma de pagamento deve ser selecionada.");
    }

    // 3. Retorna o objeto padronizado
    return {
        isValid: errors.length === 0,
        errors: errors,
    };
};