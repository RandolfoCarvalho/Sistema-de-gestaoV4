import React, { useState, useEffect } from 'react';
import api from '../../axiosConfig';

const LojaFuncionamento = () => {
    const [status, setStatus] = useState({
        isOpen: false,
        mensagem: 'Verificando...',
        manualmenteFechado: false
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Verifica se a loja está aberta baseado nos horários e dias configurados
    const verificarFuncionamento = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/1.0/Restaurante/GetRestauranteInfo');

            // Obtém dados da empresa
            const empresa = response.data.empresa;

            // Verifica se está manualmente fechada
            // Esta verificação precisaria de um endpoint específico ou um campo no modelo
            // Para este exemplo, assumiremos que essa informação está em algum lugar na API
            const manualmenteFechado = response.data.manualmenteFechado || false;

            if (manualmenteFechado) {
                setStatus({
                    isOpen: false,
                    mensagem: 'Loja fechada manualmente',
                    manualmenteFechado: true
                });
                setLoading(false);
                return;
            }

            // Obtém a data e hora atual
            const agora = new Date();
            const diaDaSemana = agora.getDay(); // 0 = Domingo, 1 = Segunda, etc.

            // Mapeia o dia da semana para a propriedade correspondente no objeto DiasFuncionamento
            const diasDaSemana = [
                'Domingo', 'Segunda', 'Terca', 'Quarta', 'Quinta', 'Sexta', 'Sabado'
            ];
            const diaAtual = diasDaSemana[diaDaSemana];

            // Verifica se a loja funciona no dia atual
            const funcionaHoje = empresa.diasFuncionamento &&
                empresa.diasFuncionamento[diaAtual.toLowerCase()];

            if (!funcionaHoje) {
                setStatus({
                    isOpen: false,
                    mensagem: `Não funcionamos aos ${diaAtual}s`,
                    manualmenteFechado: false
                });
                setLoading(false);
                return;
            }

            // Verifica se está dentro do horário de funcionamento
            const horaAtual = agora.getHours();
            const minutosAtual = agora.getMinutes();
            const horaAtualEmMinutos = horaAtual * 60 + minutosAtual;

            // Converte horários de funcionamento para minutos para facilitar comparação
            const horarioAberturaArray = empresa.horarioAbertura.split(':');
            const horarioFechamentoArray = empresa.horarioFechamento.split(':');

            const aberturaEmMinutos = parseInt(horarioAberturaArray[0]) * 60 +
                parseInt(horarioAberturaArray[1]);
            const fechamentoEmMinutos = parseInt(horarioFechamentoArray[0]) * 60 +
                parseInt(horarioFechamentoArray[1]);

            const dentroDoPeriodo = horaAtualEmMinutos >= aberturaEmMinutos &&
                horaAtualEmMinutos <= fechamentoEmMinutos;

            if (dentroDoPeriodo) {
                setStatus({
                    isOpen: true,
                    mensagem: 'Loja aberta',
                    manualmenteFechado: false
                });
            } else {
                // Calcula tempo para abertura ou para fechamento
                let mensagem;
                if (horaAtualEmMinutos < aberturaEmMinutos) {
                    const minutosParaAbrir = aberturaEmMinutos - horaAtualEmMinutos;
                    const horasParaAbrir = Math.floor(minutosParaAbrir / 60);
                    const minutosRestantes = minutosParaAbrir % 60;

                    mensagem = `Abriremos em ${horasParaAbrir}h${minutosRestantes > 0 ? ` e ${minutosRestantes}min` : ''}`;
                } else {
                    mensagem = 'Loja fechada por hoje';
                }

                setStatus({
                    isOpen: false,
                    mensagem,
                    manualmenteFechado: false
                });
            }

        } catch (error) {
            console.error('Erro ao verificar funcionamento da loja:', error);
            setError('Não foi possível verificar o status de funcionamento');
        } finally {
            setLoading(false);
        }
    };

    // Alternar estado da loja (abrir/fechar manualmente)
    const alternarEstadoLoja = async () => {
        try {
            setLoading(true);
            // Este endpoint precisaria ser implementado na API
            await api.post('/api/1.0/Restaurante/ToggleStatus', {
                manualmenteFechado: !status.manualmenteFechado
            });

            // Atualiza o estado local após a alteração
            setStatus(prevStatus => ({
                ...prevStatus,
                isOpen: !prevStatus.manualmenteFechado,
                manualmenteFechado: !prevStatus.manualmenteFechado,
                mensagem: !prevStatus.manualmenteFechado ? 'Loja fechada manualmente' : 'Loja aberta'
            }));

        } catch (error) {
            console.error('Erro ao alterar estado da loja:', error);
            setError('Não foi possível alterar o estado da loja');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        verificarFuncionamento();

        // Verificar a cada minuto
        const intervalo = setInterval(() => {
            verificarFuncionamento();
        }, 60000);

        return () => clearInterval(intervalo);
    }, []);

    return (
        <div style={styles.container}>
            {loading ? (
                <div style={styles.loadingIndicator}>Verificando status...</div>
            ) : error ? (
                <div style={styles.errorMessage}>{error}</div>
            ) : (
                <>
                    <div
                        style={{
                            ...styles.statusIndicator,
                            backgroundColor: status.isOpen ? '#4CAF50' : '#F44336'
                        }}
                    >
                        <div style={styles.statusDot}></div>
                        <span style={styles.statusText}>
                            {status.isOpen ? 'Aberto' : 'Fechado'}
                        </span>
                    </div>
                    <div style={styles.statusMessage}>{status.mensagem}</div>
                    <button
                        onClick={alternarEstadoLoja}
                        style={{
                            ...styles.toggleButton,
                            backgroundColor: status.manualmenteFechado ? '#4CAF50' : '#F44336'
                        }}
                        disabled={loading}
                    >
                        {status.manualmenteFechado ? 'Abrir Loja' : 'Fechar Loja Manualmente'}
                    </button>
                </>
            )}
        </div>
    );
};

const styles = {
    container: {
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        maxWidth: '300px',
        margin: '0 0 1rem 0'
    },
    statusIndicator: {
        display: 'flex',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        borderRadius: '4px',
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: '0.5rem'
    },
    statusDot: {
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        marginRight: '0.5rem'
    },
    statusText: {
        fontSize: '16px'
    },
    statusMessage: {
        fontSize: '14px',
        color: '#555',
        marginBottom: '1rem'
    },
    toggleButton: {
        padding: '0.5rem 1rem',
        border: 'none',
        borderRadius: '4px',
        color: '#fff',
        fontWeight: 'bold',
        cursor: 'pointer',
        width: '100%',
        transition: 'background-color 0.2s'
    },
    loadingIndicator: {
        color: '#666',
        textAlign: 'center',
        padding: '1rem'
    },
    errorMessage: {
        color: '#F44336',
        textAlign: 'center',
        padding: '1rem'
    }
};

export default LojaFuncionamento;