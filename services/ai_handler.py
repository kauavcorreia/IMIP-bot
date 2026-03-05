

import google.generativeai as genai
import os
from dotenv import load_dotenv
import json


load_dotenv() # Carrega a chave do arquivo .env

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')


def pedir_desafio_ia(idade):
    prompt = f"""
    Aja como um professor lúdico para uma criança de {idade} anos em um hospital.
    Gere UMA LISTA de 3 a 5 objetos simples (cada objeto com 4 a 6 letras).
    Retorne APENAS um JSON no formato:
    {{"palavras": ["BOLA", "GATO", "PATO"], "dica": "Dica curta relacionada às palavras", "personagem_disse": "Oi amiguinho! Consegue completar essas?"}}
    """

    try:
        response = model.generate_content(prompt)
        # Algumas versões retornam texto bruto com marcação
        text = getattr(response, 'text', None)
        if text:
            data = json.loads(text.replace('```json', '').replace('```', ''))
            return data

        # Caso response já seja dict-like
        if isinstance(response, dict):
            return response

        # Fallback: tente converter para string e parsear
        text2 = str(response)
        try:
            data = json.loads(text2)
            return data
        except Exception:
            pass

        raise RuntimeError('Resposta inesperada da API de IA')
    except Exception as e:
        # Log simples para debugar no arquivo de logs do Flask
        print(f"AI fallback: {e}")
        # Retorna desafio padrão quando a API falhar
        return {
            "palavras": ["BOLA", "GATO", "PATO"],
            "dica": "Palavras simples relacionadas a brinquedos/objetos.",
            "personagem_disse": "Oi amiguinho! Vamos tentar completar essas palavras?"
        }
