from flask import Blueprint, request, jsonify, render_template
from models import db, Crianca 
from services.ai_handler import pedir_desafio_ia
import random
import os

# Criamos o Blueprint em vez de um novo app Flask
quiz_bp = Blueprint('quiz', __name__)


@quiz_bp.route('/')
def homepage():
    return render_template('homepage.html')

@quiz_bp.route('/login')
def login():
    return render_template('login.html')

@quiz_bp.route('/cadastro')
def cadastro():
    return render_template('cadastro.html')

@quiz_bp.route('/sobre')
def sobre():
    return render_template('sobre.html')

@quiz_bp.route("/fazerLogin", methods=['POST'])
def fazer_login():
    nome = request.form.get('nome')
    crianca = Crianca.query.filter_by(nome=nome).first()
    if crianca:
        # Importante: passe o ID para o template para o JS saber quem é a criança
        return render_template('usuario.html', nome_usuario=crianca.nome, id_crianca=crianca.id)
    return "Criança não encontrada. 😊"

@quiz_bp.route('/cadastrar', methods=['POST'])
def cadastrar_crianca():
    dados = request.json
    
    nova_crianca = Crianca(
        nome=dados.get('nome'),
        idade=dados.get('idade'),
        estrelas=0)
    
    db.session.add(nova_crianca)
    db.session.commit()
    
    return jsonify({"id": nova_crianca.id, "mensagem": "Sucesso!"}), 201

@quiz_bp.route('/listar', methods=['GET'])
def listar_criancas():
    
    criancas = Crianca.query.all()
    lista = [{"id": c.id, "nome": c.nome, "estrelas": c.estrelas} for c in criancas]
    return jsonify(lista)

@quiz_bp.route('/usuarios')
def ver_usuarios():
    # Pegamos a chave enviada na URL (ex: /usuarios?chave=IMIP123)
    chave_mestra = request.args.get('chave')
    
    if chave_mestra != os.getenv("SENHA"):
        return jsonify({"erro": "Acesso negado. Apenas para administradores."}), 403

    # Se a chave estiver correta, mostra os dados
    usuarios = Crianca.query.all()
    return jsonify([{"id": u.id, "nome": u.nome, "estrelas": u.estrelas} for u in usuarios])


@quiz_bp.route('/gerar_desafio_ia/<int:id_crianca>', methods=['GET'])
def gerar_desafio_ia(id_crianca):
    # 1. Busca a idade da criança no banco para a IA se adaptar
    crianca = Crianca.query.get(id_crianca)
    if not crianca:
        return jsonify({"erro": "Criança não encontrada"}), 404

    # 2. Chama a IA (agora espera uma lista de palavras)
    dados_ia = pedir_desafio_ia(crianca.idade)
    palavras = [p.upper() for p in dados_ia.get('palavras', []) if isinstance(p, str) and p.strip()]

    if not palavras:
        return jsonify({"erro": "Nenhuma palavra gerada pela IA"}), 500

    # Seleciona uma palavra aleatória da lista retornada
    palavra = random.choice(palavras)

    # 3. Lógica de esconder a letra correta
    lista = list(palavra)
    idx = random.randint(0, len(lista) - 1)
    letra_correta = lista[idx]
    lista[idx] = "_"

    return jsonify({
        "palavra_exibir": "".join(lista),
        "letra_correta": letra_correta,
        "dica": dados_ia.get('dica', ''),
        "mensagem_personagem": dados_ia.get('personagem_disse', '')
    })

@quiz_bp.route('/verificar_resposta', methods=['POST'])
def verificar_resposta():
    dados = request.json
    id_crianca = dados.get('id_crianca')
    tentativa = dados.get('tentativa', '').upper()
    letra_correta = dados.get('correta', '').upper()

    # 1. Busca a criança no banco
    crianca = Crianca.query.get(id_crianca)
    if not crianca:
        return jsonify({"erro": "Criança não encontrada"}), 404

    # 2. Verifica se acertou
    if tentativa == letra_correta:
        # Soma 10 estrelas e salva no banco
        crianca.estrelas += 10
        db.session.commit()
        
        return jsonify({
            "status": "correto",
            "novas_estrelas": crianca.estrelas,
            "mensagem": "Incrível! Você ganhou 10 estrelas! ⭐"
        })
    else:
        return jsonify({
            "status": "errado",
            "mensagem": "Quase lá! Tente outra letra. 😊"
     })
  
