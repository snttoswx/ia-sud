# Configuração para Netlify

## ⚠️ IMPORTANTE: Netlify não suporta Flask diretamente

A Netlify é uma plataforma de hospedagem estática. Para usar o backend Python, você tem duas opções:

### Opção 1: Usar um Backend Separado (RECOMENDADO)

1. **Hospede o backend Flask em outro serviço:**
   - Render.com (gratuito)
   - Railway.app
   - Heroku
   - PythonAnywhere
   - Vercel (com funções serverless)

2. **Configure a URL do backend no frontend:**
   - Edite `script.js` e altere `API_BASE_URL` para a URL do seu backend

### Opção 2: Converter para Netlify Functions (COMPLEXO)

As Netlify Functions têm limitações e não são ideais para este projeto.

## Solução Rápida: Usar Render.com para o Backend

1. Acesse https://render.com
2. Crie uma conta gratuita
3. Conecte seu repositório GitHub
4. Crie um novo "Web Service"
5. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
   - **Environment Variables**: Adicione todas as variáveis do `.env`
6. Render fornecerá uma URL como: `https://seu-app.onrender.com`
7. Atualize `script.js` para usar essa URL

## Configuração do Frontend na Netlify

1. Faça upload apenas dos arquivos estáticos:
   - `index.html`
   - `script.js`
   - `style.css`
   - `igreja.webp`
   - `iago.png`
   - `gb.png`

2. Configure as variáveis de ambiente na Netlify (se necessário):
   - Vá em Site settings > Environment variables
   - Adicione apenas variáveis do frontend (se houver)

3. Configure o `netlify.toml` (já criado) para redirecionar todas as rotas para `index.html`

## Atualizar script.js para usar backend externo

Edite a linha 2 de `script.js`:

```javascript
const API_BASE_URL = 'https://seu-backend.onrender.com'; // URL do seu backend
```

