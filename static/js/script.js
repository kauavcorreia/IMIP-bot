// ===== FUNÇÕES DE LOGIN =====
function realizarLogin() {
    const nome = document.getElementById('login-nome').value.trim();
    
    if (!nome) {
        alert('Por favor, digite seu nome!');
        return;
    }
    
    // Envia o formulário para o servidor
    const form = new FormData();
    form.append('nome', nome);
    
    fetch('/fazerLogin', {
        method: 'POST',
        body: form
    })
    .then(response => {
        if (response.ok) {
            return response.text();
        } else {
            throw new Error('Criança não encontrada');
        }
    })
    .then(html => {
        // Redireciona para a página do usuário se encontrou
        document.open();
        document.write(html);
        document.close();
    })
    .catch(error => {
        alert('Erro: ' + error.message);
    });
}

// ===== FUNÇÕES DE CADASTRO =====
function realizarCadastro() {
    const nome = document.getElementById('cad-nome').value.trim();
    const idade = document.getElementById('cad-idade').value;
    
    if (!nome || !idade) {
        alert('Por favor, preencha todos os campos!');
        return;
    }
    
    if (idade < 1 || idade > 120) {
        alert('Por favor, digite uma idade válida!');
        return;
    }
    
    fetch('/cadastrar', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            nome: nome,
            idade: parseInt(idade)
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('✅ Cadastro realizado com sucesso!');
        // Redireciona para login
        window.location.href = '/login';
    })
    .catch(error => {
        alert('❌ Erro ao cadastrar: ' + error.message);
    });
}

// ===== FUNÇÕES DO JOGO =====
let desafioAtual = {
    palavra_exibir: '',
    letra_correta: '',
    dica: '',
    mensagem_personagem: ''
};

function carregarDesafio() {
    const idCrianca = localStorage.getItem('idCrianca');
    
    if (!idCrianca) {
        console.error('ID da criança não encontrado');
        return;
    }
    
    // Mostra mensagem de carregamento
    document.getElementById('msg-ia').textContent = 'O Robô está pensando num desafio...';
    document.getElementById('display-palavra').textContent = '...';
    
    fetch(`/gerar_desafio_ia/${idCrianca}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            desafioAtual = data;
            
            // Atualiza a página com o desafio
            document.getElementById('msg-ia').textContent = data.mensagem_personagem;
            document.getElementById('display-palavra').textContent = data.palavra_exibir;
            document.getElementById('texto-dica').textContent = data.dica;
            
            // Limpa o input e foca nele
            const inputResposta = document.getElementById('input-resposta');
            if (inputResposta) {
                inputResposta.value = '';
                inputResposta.focus();
                
                // Permite enviar com Enter
                inputResposta.onkeypress = function(event) {
                    if (event.key === 'Enter') {
                        enviarResposta();
                    }
                };
            }
        })
        .catch(error => {
            console.error('Erro ao carregar desafio:', error);
            document.getElementById('msg-ia').textContent = '❌ Erro ao gerar desafio. Tente novamente!';
        });
}

function enviarResposta() {
    const idCrianca = localStorage.getItem('idCrianca');
    const tentativa = document.getElementById('input-resposta').value.trim().toUpperCase();
    
    if (!tentativa) {
        alert('Digite uma letra!');
        return;
    }
    
    if (tentativa.length > 1) {
        alert('Digite apenas uma letra!');
        return;
    }
    
    fetch('/verificar_resposta', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id_crianca: idCrianca,
            tentativa: tentativa,
            correta: desafioAtual.letra_correta
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'correto') {
            // Atualiza estrelas
            document.getElementById('total-estrelas').textContent = data.novas_estrelas;
            
            // Mostra mensagem de sucesso
            alert('🎉 ' + data.mensagem);
            
            // Carrega próximo desafio após 1 segundo
            setTimeout(carregarDesafio, 1000);
        } else {
            // Mostra mensagem de erro
            alert('😕 ' + data.mensagem);
            
            // Limpa o input para nova tentativa
            document.getElementById('input-resposta').value = '';
            document.getElementById('input-resposta').focus();
        }
    })
    .catch(error => {
        console.error('Erro ao verificar resposta:', error);
        alert('❌ Erro ao verificar resposta. Tente novamente!');
    });
}

// ===== INICIALIZAÇÃO =====
// Atualiza as estrelas ao carregar a página (se estiver no jogo)
document.addEventListener('DOMContentLoaded', function() {
    const idCrianca = localStorage.getItem('idCrianca');
    
    // Se está na página do jogo, carrega o desafio
    if (idCrianca && document.getElementById('display-palavra')) {
        carregarDesafio();
    }
});
