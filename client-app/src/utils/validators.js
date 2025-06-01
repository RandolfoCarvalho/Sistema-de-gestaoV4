//Validações

import Swal from "sweetalert2";

//validates address in checkout
export const validateAddress = (endereco) => {
    const requiredFields = ['Logradouro', 'Numero', 'Bairro', 'Cidade', 'CEP'];
    const missingFields = [];

    requiredFields.forEach(field => {
        if (!endereco?.[field]) {
            missingFields.push(field);
        }
    });

    const cepRegex = /^\d{5}-?\d{3}$/;
    if (endereco?.CEP && !cepRegex.test(endereco.CEP)) {
        Swal.fire({
            title: "CEP Inválido",
            text: "Por favor, digite um CEP válido no formato 12345-678",
            icon: "warning",
            confirmButtonText: "Entendi",
            confirmButtonColor: "#ff5733"
        });
        return false;
    }

    if (missingFields.length > 0) {
        const fieldNames = {
            Logradouro: 'Rua',
            Numero: 'Número',
            Bairro: 'Bairro',
            Cidade: 'Cidade',
            CEP: 'CEP'
        };

        Swal.fire({
            title: "Campos obrigatórios",
            text: `Por favor, preencha os seguintes campos: ${missingFields.map(f => fieldNames[f]).join(', ')}`,
            icon: "warning",
            confirmButtonText: "Entendi",
            confirmButtonColor: "#ff5733"
        });
        return false;
    }

    return true;
};

//Validates the Form in checkout
export const validateForm = (formData) => {
    if (!validateAddress(formData.endereco)) return false;

    if (!formData.pagamento || !formData.pagamento.FormaPagamento) {
        Swal.fire({
            title: "Forma de pagamento",
            text: "Por favor, selecione uma forma de pagamento",
            icon: "warning",
            confirmButtonText: "Entendi",
            confirmButtonColor: "#ff5733"
        });
        return false;
    }

    return true;
};