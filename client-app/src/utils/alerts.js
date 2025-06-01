import Swal from "sweetalert2";

//generic messages 
export const showError = (title = "Erro", text = "Ocorreu um erro inesperado.") => {
    Swal.fire({
        title,
        text,
        icon: "error",
        confirmButtonText: "Ok",
        confirmButtonColor: "#ff5733"
    });
};

export const showWarning = (title, text) => {
    Swal.fire({
        title,
        text,
        icon: "warning",
        confirmButtonText: "Entendi",
        confirmButtonColor: "#ff5733"
    });
};

export const showInfo = (title, text) => {
    Swal.fire({
        title,
        text,
        icon: "info",
        confirmButtonText: "Ok",
        confirmButtonColor: "#ff5733"
    });
};

export const showSuccess = (title, text) => {
    return Swal.fire({
        title,
        text,
        icon: "success",
        confirmButtonText: "Ok",
        confirmButtonColor: "#28a745"
    });
};

export const confirmAction = async (title, text) => {
    return Swal.fire({
        title,
        text,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Sim, confirmar",
        cancelButtonText: "Cancelar"
    });
};