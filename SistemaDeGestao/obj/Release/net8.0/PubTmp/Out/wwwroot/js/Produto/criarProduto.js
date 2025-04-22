
$(document).ready(function () {
    var adicionais = [];

    // Adicionar adicional ao grupo
    $('#adicionarAdicionalBtn').on('click', function () {
        var adicionalNome = $('#adicionalNome').val();
        var adicionalPreco = $('#adicionalPreco').val();

        if (adicionalNome && adicionalPreco) {
            var adicionalItem = '<div>' + adicionalNome + ' - ' + adicionalPreco + '</div>';
            $('#adicionalList').append(adicionalItem);

            // Limpar campos de adicional
            $('#adicionalNome').val('');
            $('#adicionalPreco').val('');
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Por favor, preencha todos os campos!',
                showConfirmButton: true
            });
        }
    });

    // Salvar grupo de adicionais com seus adicionais
    $('#salvarGrupoAdicionalBtn').on('click', function () {
        var grupoNome = $('#grupoAdicionalNome').val(); // Captura o valor do campo de entrada
        var adicionais = [];

        console.log('Grupo Nome:', grupoNome); // Deve exibir o valor digitado no campo de entrada
        console.log('Adicionais:', adicionais);

        $('#adicionalList div').each(function () {
            var adicional = $(this).text().split(' - ');
            adicionais.push({
                Nome: adicional[0],
                Preco: parseFloat(adicional[1])
            });
        });

        if (grupoNome && adicionais.length > 0) {
            fetch(`${window.location.origin}/admin/GrupoAdicional/CriarGrupoAdicional`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    Nome: grupoNome,
                    Adicionais: adicionais
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Erro ao salvar o grupo de adicionais: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => {
                    // Sucesso no envio dos dados
                    console.log(data);

                    // Fechar o modal do grupo de adicionais
                    $('#modalGrupoAdicional').modal('hide');

                    // Resetar a lista de adicionais e o formulário do grupo
                    adicionais = [];
                    $('#formGrupoAdicional')[0].reset();
                    $('#adicionalList').empty();

                    Swal.fire({
                        icon: 'success',
                        title: 'Grupo de adicionais adicionado com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                    });
                    location.reload();
                })
                .catch(error => {
                    console.error('Erro ao salvar o grupo de adicionais:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Erro ao salvar o grupo de adicionais.',
                        text: error.message || 'Um erro inesperado ocorreu. Tente novamente mais tarde.',
                        showConfirmButton: true
                    });
                });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Por favor, preencha todos os campos!',
                showConfirmButton: true
            });
        }
    });

    $('#salvarETerminarBtn').on('click', function () {
        $('#modalGrupoAdicional').modal('show');
    });

    $('.selectpicker').selectpicker();
});


// Evento ao clicar no botão de salvar categoria
document.getElementById('salvarCategoriaBtn').addEventListener('click', function () {
    var newCategoryName = document.getElementById('newCategoryName').value;
    var newCategoryDescription = document.getElementById('newCategoryDescription').value;

    if (newCategoryName && newCategoryDescription) {
        fetch('/admin/Categoria/PostNovaCategoria', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ Nome: newCategoryName, Descricao: newCategoryDescription })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao adicionar categoria: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            Swal.fire({
                icon: 'success',
                title: 'Categoria adicionada com sucesso!',
                showConfirmButton: false,
                timer: 1500,
            });

            $('#modalNovaCategoria').modal('hide');

            fetch('/admin/Categoria/FindAll')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao obter categorias: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                var selectCategoria = document.getElementById('CategoriaId');
                selectCategoria.innerHTML = '';

                data.forEach(categoria => {
                    var option = document.createElement('option');
                    option.value = categoria.id;
                    option.textContent = categoria.nome;
                    selectCategoria.appendChild(option);
                });
                setTimeout(function () {
                    location.reload();
                }, 1500);

                $('.selectpicker').selectpicker('refresh');
            })
            .catch(error => {
                console.error('Erro ao obter categorias:', error);
            });
        })
        .catch(error => {
            console.error('Erro ao adicionar categoria:', error);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao adicionar categoria',
                text: 'Por favor, busque suporte do responsável especializado.'
            });
        });

    } else {
        alert('Por favor, preencha todos os campos.');
    }
});

function editarCategoria(categoriaId) {
    var editedCategoryName = document.getElementById('editCategoryName').value;
    var editedCategoryDescription = document.getElementById('editCategoryDescription').value;

    if (editedCategoryName && editedCategoryDescription) {
        fetch(`/admin/Categoria/Edit`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                Id: categoriaId,
                Nome: editedCategoryName,
                Descricao: editedCategoryDescription
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao editar categoria: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                Swal.fire({
                    icon: 'success',
                    title: data,
                    showConfirmButton: false,
                    timer: 1500,
                });

                $('#modalEditCategoria').modal('hide');

                // Atualizar a lista de categorias após edição
                fetch('/admin/Categoria/FindAll')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao obter categorias: ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        var selectCategoria = document.getElementById('CategoriaId');
                        selectCategoria.innerHTML = '';

                        data.forEach(categoria => {
                            var option = document.createElement('option');
                            option.value = categoria.id;
                            option.textContent = categoria.nome;
                            selectCategoria.appendChild(option);
                        });
                        setTimeout(function () {
                            location.reload();
                        }, 1500);

                        $('.selectpicker').selectpicker('refresh');
                    })
                    .catch(error => {
                        console.error('Erro ao obter categorias:', error);
                    });
            })
            .catch(error => {
                console.error('Erro ao editar categoria:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro ao editar categoria',
                    text: 'Por favor, busque suporte do responsável especializado.'
                });
            });

    } else {
        alert('Por favor, preencha todos os campos.');
    }
}



function deletarCategoria(categoriaId) {
    if (confirm('Tem certeza de que deseja deletar esta categoria?')) {
        console.log("arroz"); // Verifique se esta linha aparece no console
        $.ajax({
            url: deleteCategoriaUrl,
            type: 'POST',
            data: { id: categoriaId },
            success: function (result) {
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Categoria deletada com sucesso!',
                        showConfirmButton: false,
                        timer: 1500,
                    });
                    setTimeout(function () {
                        location.reload();
                    }, 1500);
                    $('#categoria-list').find('li[data-id="' + categoriaId + '"]').remove();
                } else {
                    alert('Erro ao deletar a categoria.');
                }
            },
            error: function () {
                alert('Erro na comunicação com o servidor.');
            }
        });
    }
}

// Formulário de criação de grupo de adicionais
document.getElementById('formGrupoAdicional').addEventListener('submit', function (e) {
    e.preventDefault();

    var grupoNome = document.getElementById('grupoNome').value;

    if (grupoNome) {
        localStorage.setItem('grupoNome', grupoNome);

        document.getElementById('grupoNome').value = '';
        $('#modalGrupoAdicional').modal('hide');
    } else {
        Swal.fire({
            icon: 'error',
            title: 'Por favor, preencha o nome do grupo!',
            showConfirmButton: true
        });
    }
});

//Salvar produto
document.getElementById('salvarProdutoBtn').addEventListener('click', function (event) {
    event.preventDefault();

    var CategoriaId = document.getElementById('CategoriaId').value;
    var Nome = document.getElementById('Nome').value;
    var Descricao = document.getElementById('Descricao').value;
    var Preco = document.getElementById('Preco').value;
    var ProductImage = document.getElementById('ProductImage').value;
    var QuantidadeEstoque = document.getElementById('QuantidadeEstoque').value;
    var GrupoAdicionalId = document.getElementById('GrupoAdicionalId').value;

    if (CategoriaId && Nome && Descricao && Preco && ProductImage && QuantidadeEstoque && GrupoAdicionalId) {
        fetch('/admin/Produto/CriarProduto', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                CategoriaId: CategoriaId,
                Nome: Nome,
                Descricao: Descricao,
                Preco: Preco,
                ProductImage: ProductImage,
                QuantidadeEstoque: QuantidadeEstoque,
                GrupoAdicionalId: GrupoAdicionalId
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao adicionar produto2: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                Swal.fire({
                    icon: 'success',
                    title: 'Produto adicionado com sucesso!',
                    showConfirmButton: false,
                    timer: 1500,
                });

                $('#modalNovoProduto').modal('hide');

                // Atualizar a lista de produtos
                fetch('/admin/Produto/FindAll')
                    .then(response => {
                        if (!response.ok) {
                            throw new Error('Erro ao obter produtos: ' + response.statusText);
                        }
                        return response.json();
                    })
                    .then(data => {
                        // Atualizar a UI com a lista de produtos
                        // Esta parte depende de como você está renderizando os produtos na página
                        // Exemplo: Atualizar uma tabela de produtos
                        var tabelaProdutos = document.getElementById('tabelaProdutos');
                        tabelaProdutos.innerHTML = '';

                        data.forEach(produto => {
                            var row = tabelaProdutos.insertRow();
                            row.insertCell(0).textContent = produto.nome;
                            row.insertCell(1).textContent = produto.descricao;
                            row.insertCell(2).textContent = produto.preco;
                            // Continue para outras colunas conforme necessário
                        });

                        $('.selectpicker').selectpicker('refresh');
                    })
                    .catch(error => {
                        console.error('Erro ao obter produtos:', error);
                    });
            })
            .catch(error => {
                console.error('Erro ao adicionar produto1:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro ao adicionar produto',
                    text: 'Por favor, busque suporte do responsável especializado.'
                });
            });

    } else {
        alert('Por favor, preencha todos os campos.');
    }
});