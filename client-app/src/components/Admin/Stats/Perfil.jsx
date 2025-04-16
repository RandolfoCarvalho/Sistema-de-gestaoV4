import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import api from '../../../axiosConfig';
import LojaFuncionamento from '../../Pedidos/LojaFuncionamento'; // Importando o novo componente

const Perfil = () => {
    const [senha, setSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mensagemErro, setMensagemErro] = useState("");
    const [mostrarAccessToken, setMostrarAccessToken] = useState(false);
    const [restaurante, setRestaurante] = useState({
        id: 0,
        userName: '',
        phoneNumber: '',
        emailAddress: '',
        nomeDaLoja: '',
        password: '',
        empresa: {
            id: 0,
            cnpj: '',
            cpf: '',
            razaoSocial: '',
            nomeFantasia: '',
            endereco: '',
            bairro: '',
            cidade: '',
            estado: '',
            cep: '',
            horarioAbertura: '08:00',
            horarioFechamento: '18:00',
            diasFuncionamento: {
                domingo: false,
                segunda: true,
                terca: true,
                quarta: true,
                quinta: true,
                sexta: true,
                sabado: false
            },
            observacoes: ''
        },
        mercadoPago: {
            publicKey: '',
            accessToken: '',
            clientId: '',
            clientSecret: '',
            ativo: false
        }
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('dados-restaurante');

    useEffect(() => {
        const fetchRestaurante = async () => {
            try {
                setLoading(true);
                const response = await api.get('/api/1.0/Restaurante/GetRestauranteInfo');
                console.log(response);
                const restauranteData = response.data.restaurante;
                const empresa = restauranteData.empresa;
    
                const horarioAbertura = empresa.horarioAbertura
                    ? new Date(`2000-01-01T${empresa.horarioAbertura}`).toTimeString().slice(0, 5)
                    : '08:00';
    
                const horarioFechamento = empresa.horarioFechamento
                    ? new Date(`2000-01-01T${empresa.horarioFechamento}`).toTimeString().slice(0, 5)
                    : '18:00';
    
                const diasFuncionamento = empresa.diasFuncionamento || {
                    domingo: false,
                    segunda: true,
                    terca: true,
                    quarta: true,
                    quinta: true,
                    sexta: true,
                    sabado: false
                };
    
                setRestaurante({
                    ...restauranteData,
                    empresa: {
                        ...empresa,
                        horarioAbertura,
                        horarioFechamento,
                        diasFuncionamento
                    },
                    mercadoPago: {
                        publicKey: response.data.credenciaisMercadoPago?.publicKey || '',
                        accessToken: response.data.credenciaisMercadoPago?.accessToken || '',
                        clientId: response.data.credenciaisMercadoPago?.clientId || '',
                        clientSecret: response.data.credenciaisMercadoPago?.clientSecret || '',
                        ativo: response.data.credenciaisMercadoPago?.ativo
                    }
                });
    
            } catch (error) {
                console.error('Erro ao carregar dados do restaurante:', error);
                setMessage({ type: 'error', text: 'Erro ao carregar dados do perfil.' });
            } finally {
                setLoading(false);
            }
        };
    
        fetchRestaurante();
    }, []);
    

    const handleMercadoPagoChange = (e) => {
        const { name, value, type, checked } = e.target;
        setRestaurante((prevState) => ({
            ...prevState,
            mercadoPago: {
                ...prevState.mercadoPago,
                [name]: type === 'checkbox' ? checked : value
            }
        }));
    };
    
    
    // Atualizar valores do restaurante
    const handleRestauranteChange = (e) => {
        const { name, value } = e.target;
        setRestaurante(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleMostrarSenha = () => {
        setMostrarSenha(!mostrarSenha);
    };

    // Atualizar valores da empresa
    const handleEmpresaChange = (e) => {
        const { name, value } = e.target;
        setRestaurante(prev => ({
            ...prev,
            empresa: {
                ...prev.empresa,
                [name]: value
            }
        }));
    };

    // Handler para os checkboxes de dias de funcionamento
    const handleDiaFuncionamentoChange = (e) => {
        const { name, checked } = e.target;
        setRestaurante(prev => ({
            ...prev,
            empresa: {
                ...prev.empresa,
                diasFuncionamento: {
                    ...prev.empresa.diasFuncionamento,
                    [name]: checked
                }
            }
        }));
    };

    // Salvar alterações
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validação de senha
        if (senha && senha !== confirmarSenha) {
            setMensagemErro("As senhas não conferem.");
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });
        setMensagemErro("");

        try {
            const dadosParaEnviar = {
                ...restaurante,
                password: senha || null,
                empresa: {
                    ...restaurante.empresa,
                    horarioAbertura: restaurante.empresa.horarioAbertura + ":00",
                    horarioFechamento: restaurante.empresa.horarioFechamento + ":00",
                    diasFuncionamento: restaurante.empresa.diasFuncionamento,
                    // Remover campos nulos
                    ...(restaurante.empresa.cnpj && { cnpj: restaurante.empresa.cnpj }),
                    ...(restaurante.empresa.cpf && { cpf: restaurante.empresa.cpf }),
                    ...(restaurante.empresa.razaoSocial && { razaoSocial: restaurante.empresa.razaoSocial }),
                    ...(restaurante.empresa.nomeFantasia && { nomeFantasia: restaurante.empresa.nomeFantasia }),
                    ...(restaurante.empresa.endereco && { endereco: restaurante.empresa.endereco }),
                    ...(restaurante.empresa.bairro && { bairro: restaurante.empresa.bairro }),
                    ...(restaurante.empresa.cidade && { cidade: restaurante.empresa.cidade }),
                    ...(restaurante.empresa.estado && { estado: restaurante.empresa.estado }),
                    ...(restaurante.empresa.cep && { cep: restaurante.empresa.cep }),
                    ...(restaurante.empresa.observacoes && { observacoes: restaurante.empresa.observacoes })
                }
            }
            const CredenciaisDePagamento = {
                PublicKey: restaurante.mercadoPago?.publicKey || '',
                AccessToken: restaurante.mercadoPago?.accessToken || '',
                ClientId: restaurante.mercadoPago?.clientId || '',
                ClientSecret: restaurante.mercadoPago?.clientSecret || '',
                Ativo: restaurante.mercadoPago?.ativo || false
            };
            

            await api.post('/api/1.0/CredenciaisMercadoPago/CreateCredential', CredenciaisDePagamento);
            await api.put('/api/1.0/Restaurante/UpdateProfile', dadosParaEnviar);

            setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            // Limpar campos de senha após envio bem-sucedido
            setSenha("");
            setConfirmarSenha("");
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            setMessage({ type: 'error', text: 'Erro ao atualizar perfil. Tente novamente.' });
        } finally {
            setLoading(false);
        }
    };

    // Estilos inline para o componente
    const styles = {
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '20px'
        },
        card: {
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            background: '#fff'
        },
        cardHeader: {
            padding: '16px',
            borderBottom: '1px solid #eee'
        },
        cardTitle: {
            fontSize: '1.5rem',
            fontWeight: 'bold',
            margin: 0
        },
        cardContent: {
            padding: '16px'
        },
        message: {
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '16px'
        },
        successMessage: {
            backgroundColor: '#d4edda',
            color: '#155724',
            border: '1px solid #c3e6cb'
        },
        errorMessage: {
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb'
        },
        tabList: {
            display: 'flex',
            borderBottom: '1px solid #dee2e6',
            marginBottom: '16px'
        },
        tab: {
            padding: '8px 16px',
            cursor: 'pointer',
            border: 'none',
            background: 'none',
            fontWeight: 500
        },
        activeTab: {
            borderBottom: '2px solid #007bff',
            color: '#007bff'
        },
        formGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '16px'
        },
        fullWidth: {
            gridColumn: '1 / -1'
        },
        formGroup: {
            marginBottom: '16px'
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            fontWeight: 500
        },
        input: {
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ced4da',
            fontSize: '16px'
        },
        textarea: {
            width: '100%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ced4da',
            fontSize: '16px',
            minHeight: '100px'
        },
        button: {
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
        },
        buttonDisabled: {
            backgroundColor: '#6c757d',
            cursor: 'not-allowed'
        },
        buttonContainer: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '24px'
        },
        inlineIcon: {
            marginRight: '8px',
            verticalAlign: 'middle'
        }
    };

    // Renderiza o conteúdo da aba de acordo com a aba ativa
    const renderTabContent = () => {
        switch (activeTab) {
            case 'dados-restaurante':
                return (
                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="userName">Nome de Usuário</label>
                            <input
                                style={styles.input}
                                id="userName"
                                name="userName"
                                value={restaurante.userName}
                                onChange={handleRestauranteChange}
                                required
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="nomeDaLoja">Nome da Loja</label>
                            <input
                                style={styles.input}
                                id="nomeDaLoja"
                                name="nomeDaLoja"
                                value={restaurante.nomeDaLoja || ''}
                                onChange={handleRestauranteChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="emailAddress">Email</label>
                            <input
                                style={styles.input}
                                id="emailAddress"
                                name="emailAddress"
                                type="email"
                                value={restaurante.emailAddress || ''}
                                onChange={handleRestauranteChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="phoneNumber">Telefone</label>
                            <input
                                style={styles.input}
                                id="phoneNumber"
                                name="phoneNumber"
                                value={restaurante.phoneNumber || ''}
                                onChange={handleRestauranteChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="password">
                                Nova Senha (deixe em branco para manter a atual)
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    style={styles.input}
                                    id="password"
                                    name="password"
                                    type={mostrarSenha ? "text" : "password"}
                                    value={senha}
                                    onChange={(e) => setSenha(e.target.value)}
                                    placeholder="Digite para alterar a senha"
                                />
                                <button
                                    type="button"
                                    onClick={toggleMostrarSenha}
                                    style={{
                                        position: 'absolute',
                                        right: '8px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {mostrarSenha ? "Ocultar" : "Mostrar"}
                                </button>
                            </div>
                        </div>
                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="confirmarSenha">
                                Confirmar Nova Senha
                            </label>
                            <input
                                style={styles.input}
                                id="confirmarSenha"
                                name="confirmarSenha"
                                type={mostrarSenha ? "text" : "password"}
                                value={confirmarSenha}
                                onChange={(e) => setConfirmarSenha(e.target.value)}
                                placeholder="Confirme a nova senha"
                            />
                            {senha !== confirmarSenha && confirmarSenha !== "" && (
                                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                                    As senhas não conferem
                                </div>
                            )}
                        </div>

                        {mensagemErro && <p style={styles.error}>{mensagemErro}</p>}

                    </div>
                );

            case 'dados-empresa':
                return (
                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="cnpj">CNPJ</label>
                            <input
                                style={styles.input}
                                id="cnpj"
                                name="cnpj"
                                value={restaurante.empresa.cnpj || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="cpf">CPF</label>
                            <input
                                style={styles.input}
                                id="cpf"
                                name="cpf"
                                value={restaurante.empresa.cpf || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="razaoSocial">Razão Social</label>
                            <input
                                style={styles.input}
                                id="razaoSocial"
                                name="razaoSocial"
                                value={restaurante.empresa.razaoSocial || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="nomeFantasia">Nome Fantasia</label>
                            <input
                                style={styles.input}
                                id="nomeFantasia"
                                name="nomeFantasia"
                                value={restaurante.empresa.nomeFantasia || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="endereco">Endereço</label>
                            <input
                                style={styles.input}
                                id="endereco"
                                name="endereco"
                                value={restaurante.empresa.endereco || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="bairro">Bairro</label>
                            <input
                                style={styles.input}
                                id="bairro"
                                name="bairro"
                                value={restaurante.empresa.bairro || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="cidade">Cidade</label>
                            <input
                                style={styles.input}
                                id="cidade"
                                name="cidade"
                                value={restaurante.empresa.cidade || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="estado">Estado</label>
                            <input
                                style={styles.input}
                                id="estado"
                                name="estado"
                                value={restaurante.empresa.estado || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="cep">CEP</label>
                            <input
                                style={styles.input}
                                id="cep"
                                name="cep"
                                value={restaurante.empresa.cep || ''}
                                onChange={handleEmpresaChange}
                            />
                        </div>
                    </div>
                );

            case 'horarios':
                return (
                    <div style={styles.formGrid}>
                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="horarioAbertura">Horário de Abertura</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {typeof Clock === 'function' && <Clock size={16} style={styles.inlineIcon} />}
                                <input
                                    style={styles.input}
                                    id="horarioAbertura"
                                    name="horarioAbertura"
                                    type="time"
                                    value={restaurante.empresa.horarioAbertura}
                                    onChange={handleEmpresaChange}
                                />
                            </div>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label} htmlFor="horarioFechamento">Horário de Fechamento</label>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                {typeof Clock === 'function' && <Clock size={16} style={styles.inlineIcon} />}
                                <input
                                    style={styles.input}
                                    id="horarioFechamento"
                                    name="horarioFechamento"
                                    type="time"
                                    value={restaurante.empresa.horarioFechamento}
                                    onChange={handleEmpresaChange}
                                />
                            </div>
                        </div>

                        {/* Dias de funcionamento */}
                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                            <label style={styles.label}>Dias de Funcionamento</label>
                            <div style={styles.checkboxGrid}>
                                <div style={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="domingo"
                                        name="domingo"
                                        checked={restaurante.empresa.diasFuncionamento.domingo}
                                        onChange={handleDiaFuncionamentoChange}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="domingo" style={styles.checkboxLabel}>Domingo</label>
                                </div>
                                <div style={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="segunda"
                                        name="segunda"
                                        checked={restaurante.empresa.diasFuncionamento.segunda}
                                        onChange={handleDiaFuncionamentoChange}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="segunda" style={styles.checkboxLabel}>Segunda-feira</label>
                                </div>
                                <div style={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="terca"
                                        name="terca"
                                        checked={restaurante.empresa.diasFuncionamento.terca}
                                        onChange={handleDiaFuncionamentoChange}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="terca" style={styles.checkboxLabel}>Terça-feira</label>
                                </div>
                                <div style={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="quarta"
                                        name="quarta"
                                        checked={restaurante.empresa.diasFuncionamento.quarta}
                                        onChange={handleDiaFuncionamentoChange}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="quarta" style={styles.checkboxLabel}>Quarta-feira</label>
                                </div>
                                <div style={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="quinta"
                                        name="quinta"
                                        checked={restaurante.empresa.diasFuncionamento.quinta}
                                        onChange={handleDiaFuncionamentoChange}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="quinta" style={styles.checkboxLabel}>Quinta-feira</label>
                                </div>
                                <div style={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="sexta"
                                        name="sexta"
                                        checked={restaurante.empresa.diasFuncionamento.sexta}
                                        onChange={handleDiaFuncionamentoChange}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="sexta" style={styles.checkboxLabel}>Sexta-feira</label>
                                </div>
                                <div style={styles.checkboxContainer}>
                                    <input
                                        type="checkbox"
                                        id="sabado"
                                        name="sabado"
                                        checked={restaurante.empresa.diasFuncionamento.sabado}
                                        onChange={handleDiaFuncionamentoChange}
                                        style={styles.checkbox}
                                    />
                                    <label htmlFor="sabado" style={styles.checkboxLabel}>Sábado</label>
                                </div>
                            </div>
                        </div>

                        <div style={{ ...styles.formGroup, ...styles.fullWidth }}>
                            <label style={styles.label} htmlFor="observacoes">Observações</label>
                            <textarea
                                style={styles.textarea}
                                id="observacoes"
                                name="observacoes"
                                rows={4}
                                value={restaurante.empresa.observacoes || ''}
                                onChange={handleEmpresaChange}
                                placeholder="Informações adicionais, como regras, etc."
                            />
                        </div>
                    </div>
                );
                case 'dados-mercado-pago':
                    return (
                        <div style={styles.formGrid}>
                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="publicKey">Public Key</label>
                                <input
                                    style={styles.input}
                                    id="publicKey"
                                    name="publicKey"
                                    value={restaurante.mercadoPago?.publicKey || ''}
                                    onChange={handleMercadoPagoChange}
                                    placeholder="Sua chave pública do Mercado Pago"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="accessToken">Access Token</label>
                                <input
                                    style={styles.input}
                                    id="accessToken"
                                    name="accessToken"
                                    type={mostrarAccessToken ? "text" : "password"}
                                    value={restaurante.mercadoPago?.accessToken || ''}
                                    onChange={handleMercadoPagoChange}
                                    placeholder="Sua chave privada do Mercado Pago"
                                />
                                <button
                                    type="button"
                                    onClick={() => setMostrarAccessToken(!mostrarAccessToken)}
                                    style={{
                                        marginTop: '5px',
                                        background: 'none',
                                        border: 'none',
                                        color: 'blue',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {mostrarAccessToken ? 'Ocultar' : 'Mostrar'} chave
                                </button>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="clientId">Client ID</label>
                                <input
                                    style={styles.input}
                                    id="clientId"
                                    name="clientId"
                                    value={restaurante.mercadoPago?.clientId || ''}
                                    onChange={handleMercadoPagoChange}
                                    placeholder="Client ID"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label} htmlFor="clientSecret">Client Secret</label>
                                <input
                                    style={styles.input}
                                    id="clientSecret"
                                    name="clientSecret"
                                    value={restaurante.mercadoPago?.clientSecret || ''}
                                    onChange={handleMercadoPagoChange}
                                    placeholder="Client Secret"
                                />
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.label}>
                                    <input
                                        type="checkbox"
                                        name="ativo"
                                        checked={restaurante.mercadoPago?.ativo || false}
                                        onChange={handleMercadoPagoChange}
                                    />
                                    {' '}Ativo
                                </label>
                            </div>
                        </div>
                    );


            default:
                return null;
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.cardHeader}>
                    <h2 style={styles.cardTitle}>Perfil do Restaurante</h2>
                </div>
                <div style={styles.cardContent}>
                    {message.text && (
                        <div style={{
                            ...styles.message,
                            ...(message.type === 'success' ? styles.successMessage : styles.errorMessage)
                        }}>
                            {message.text}
                        </div>
                    )}

                    <div style={styles.tabList}>
                        <button
                            style={{ ...styles.tab, ...(activeTab === 'dados-restaurante' ? styles.activeTab : {}) }}
                            onClick={() => setActiveTab('dados-restaurante')}
                        >
                            Dados do Restaurante
                        </button>
                        <button
                            style={{ ...styles.tab, ...(activeTab === 'dados-empresa' ? styles.activeTab : {}) }}
                            onClick={() => setActiveTab('dados-empresa')}
                        >
                            Dados da Empresa
                        </button>
                        <button
                            style={{ ...styles.tab, ...(activeTab === 'horarios' ? styles.activeTab : {}) }}
                            onClick={() => setActiveTab('horarios')}
                        >
                            Horários e Observações
                        </button>
                        <button
                            style={{ ...styles.tab, ...(activeTab === 'dados-mercado-pago' ? styles.activeTab : {}) }}
                            onClick={() => setActiveTab('dados-mercado-pago')}
                        >
                            Credenciais de recebimento
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {renderTabContent()}

                        <div style={styles.buttonContainer}>
                            <button
                                type="submit"
                                style={{ ...styles.button, ...(loading ? styles.buttonDisabled : {}) }}
                                disabled={loading}
                            >
                                {loading ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Perfil;