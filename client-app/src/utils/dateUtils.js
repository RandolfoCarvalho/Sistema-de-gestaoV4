export const formatDisplayDateTime = (dateInstance) => {
    if (!(dateInstance instanceof Date) || isNaN(dateInstance.getTime())) {
        console.warn("formatDisplayDateTime recebeu data inválida:", dateInstance);
        return "Data inválida"; // Ou um placeholder, ou lançar erro
    }

    const now = new Date();
    const isToday = dateInstance.getDate() === now.getDate() &&
                    dateInstance.getMonth() === now.getMonth() &&
                    dateInstance.getFullYear() === now.getFullYear();

    const timeString = dateInstance.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });

    if (isToday) {
        return `Hoje, ${timeString}`;
    } else {
        const dateString = dateInstance.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            // year: '2-digit' // Descomente se quiser o ano
        });
        return `${dateString}, ${timeString}`;
    }
};