#!/bin/bash
# Script para rodar o Flask sem erro de porta ocupada

cd /home/kaua/IMIP

# Mata qualquer processo Flask anterior
pkill -f "python app.py" 2>/dev/null
sleep 1

# Ativa o ambiente virtual e roda
source .venv/bin/activate
python app.py
dotenv run python app.py
