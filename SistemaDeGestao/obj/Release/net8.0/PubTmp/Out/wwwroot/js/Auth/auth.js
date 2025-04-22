// auth.j
document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Previne o comportamento padrão do form

    var username = document.getElementById("Username").value;
    var password = document.getElementById("Password").value;

    fetch(`${window.location.origin}/admin/Auth/Login`, { 
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ Username: username, Password: password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Login realizado com sucesso!");
                window.location.href = "/Home"; // Redireciona para a página inicial ou outra página
            } else {
                alert("Erro: " + data.message); // Exibe a mensagem de erro
            }
        })
        .catch(error => {
            alert("Erro ao tentar fazer login: " + error);
        });
});


/*function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// Função para autenticar o usuário
function login(userCredentials) {
    fetch('/auth/signin', {
        method: 'POST',
        body: JSON.stringify(userCredentials),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.accessToken) {
                localStorage.setItem('AuthToken', data.accessToken);
                // Redireciona ou atualiza a UI, por exemplo:
                window.location.href = '/Admin/Produto'; // Redireciona para o controlador de produtos
            } else {
                // Lidar com erro de autenticação
                console.error('Erro ao autenticar', data);
            }
        })
        .catch(error => console.error('Erro:', error));
}

// Exemplo de uso para obter o token
const token = getCookie('AuthToken');
console.log(token); // Aqui você pode usar o token conforme necessário
*/