// --- CONFIGURAÇÃO GLOBAL ---
let desafioAtual = {};
let idCriancaLogada = localStorage.getItem('idCrianca'); // Recupera o ID após o login

// --- 1. LÓGICA DE CADASTRO ---
async function realizarCadastro() {
    const nome = document.getElementById('cad-nome').value;
    const idade = document.getElementById('cad-idade').value;

    if (!nome || !idade) {
        alert("Por favor, preencha o nome e a idade! 😊");
        return;
    }

    try {
        const response = await fetch('/cadastrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome: nome, idade: parseInt(idade) })
        });

        const dados = await response.json();
        if (response.ok) {
            alert("Cadastro realizado com sucesso! Agora faça o login.");
            window.location.href = "/login";
        }
    } catch (error) {
        console.error("Erro no cadastro:", error);
    }
}

// --- 2. LÓGICA DE LOGIN ---
async function realizarLogin() {
    const nome = document.getElementById('login-nome').value;

    // Criamos um FormData para enviar como formulário, como seu Python espera
    const formData = new FormData();
    formData.append('nome', nome);

    try {
        const response = await fetch('/fazer_login', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            // Se o login funcionar, o Flask redireciona ou manda os dados
            // Para simplificar no JS, vamos salvar o ID e ir para a página do usuário
            // (Ajuste a rota /fazer_login para retornar JSON com o ID se preferir)
            window.location.href = `/usuarios/${nome}`;
        } else {
            alert("Criança não encontrada. Verifique o nome!");
        }
    } catch (error) {
        console.error("Erro no login:", error);
    }
}

// --- 3. LÓGICA DO QUIZ (IA) ---
async function carregarDesafio() {
    if (!idCriancaLogada) return;

    try {
        const response = await fetch(`/gerar_desafio_ia/${idCriancaLogada}`);
        desafioAtual = await response.json();

        // Atualiza os elementos da tela (Certifique-se que esses IDs existam em usuarios.html)
        document.getElementById('display-palavra').innerText = desafioAtual.palavra_exibir;
        document.getElementById('texto-dica').innerText = desafioAtual.dica;
        document.getElementById('msg-ia').innerText = desafioAtual.mensagem_personagem;
    } catch (error) {
        console.log("Erro ao carregar desafio da IA.");
    }
}

async function enviarResposta() {
    const inputField = document.getElementById('input-resposta');
    const letra = inputField.value.toUpperCase();

    // Validação simples para não enviar vazio
    if (!letra) {
        alert("Digite uma letra primeiro! 😊");
        return;
    }

    try {
        const response = await fetch('/verificar_resposta', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_crianca: idCriancaLogada,
                tentativa: letra,
                correta: desafioAtual.letra_correta
            })
        });

        const resultado = await response.json();

        if (resultado.status === "correto") {
            // Atualiza as estrelas na tela
            document.getElementById('total-estrelas').innerText = resultado.novas_estrelas;
            alert(resultado.mensagem);
            
            // Limpa o campo para a próxima rodada
            inputField.value = "";
            
            // Gera um novo desafio da IA
            carregarDesafio(); 
        } else {
            alert(resultado.mensagem);
            inputField.value = ""; // Limpa para tentar de novo
        }

    } catch (error) {
        console.error("Erro ao verificar resposta:", error);
        alert("Ops! Tivemos um probleminha de conexão. Tente de novo!");
    }
}

    const resultado = await response.json();
    if (resultado.status === "correto") {
        alert("⭐ Parabéns! Você ganhou 10 estrelas!");
        carregarDesafio(); // Carrega o próximo
    } else {
        alert("Tente de novo! Você consegue! 💪");
    }
