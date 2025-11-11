# Como Deployar na Netlify

## ⚠️ PROBLEMA: Netlify não executa Python/Flask

A Netlify é uma plataforma de hospedagem **estática**. Ela não executa servidores Python/Flask.

## ✅ SOLUÇÃO: Backend Separado + Frontend na Netlify

### Passo 1: Hospedar o Backend (Flask) em outro serviço

**Opção A: Render.com (RECOMENDADO - GRATUITO)**

1. Acesse https://render.com e crie uma conta
2. Clique em "New" → "Web Service"
3. Conecte seu repositório GitHub (ou faça upload do código)
4. Configure:
   - **Name**: `iasud-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
5. Adicione as variáveis de ambiente:
   - `GEMINI_API_KEY` (ou `GEMINI_API_KEYS`)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SECRET_KEY`
   - `JWT_SECRET`
6. Render fornecerá uma URL: `https://iasud-backend.onrender.com`

**Opção B: Railway.app**
- Similar ao Render, também gratuito

**Opção C: PythonAnywhere**
- Hospedagem Python gratuita

### Passo 2: Atualizar o Frontend para usar o Backend

Edite o arquivo `script.js` na linha 2:

```javascript
// ANTES:
const API_BASE_URL = window.location.origin;

// DEPOIS (substitua pela URL do seu backend):
const API_BASE_URL = 'https://iasud-backend.onrender.com';
```

### Passo 3: Deploy do Frontend na Netlify

1. Acesse https://app.netlify.com
2. Clique em "Add new site" → "Deploy manually"
3. Faça upload de uma pasta ZIP com:
   - `index.html`
   - `script.js`
   - `style.css`
   - `igreja.webp`
   - `iago.png`
   - `gb.png`
   - `netlify.toml` (já criado)
4. Ou conecte seu repositório GitHub

### Passo 4: Configurar CORS no Backend

O arquivo `app.py` já tem CORS configurado, mas certifique-se de que permite o domínio da Netlify:

```python
CORS(app, supports_credentials=True, origins=['*'])  # Já está assim
```

### Passo 5: Atualizar Google OAuth

No Google Cloud Console, adicione as URLs:
- **Redirect URI**: `https://seu-backend.onrender.com/auth/google/callback`
- **Authorized JavaScript origins**: 
  - `https://seu-backend.onrender.com`
  - `https://seu-site.netlify.app`

## Arquivos para Netlify

Faça upload apenas destes arquivos para a Netlify:
- ✅ `index.html`
- ✅ `script.js`
- ✅ `style.css`
- ✅ `igreja.webp`
- ✅ `iago.png`
- ✅ `gb.png`
- ✅ `netlify.toml`

**NÃO faça upload:**
- ❌ `app.py` (vai para Render/Railway)
- ❌ `requirements.txt` (vai para Render/Railway)
- ❌ `data/` (vai para Render/Railway)
- ❌ `.env` (nunca faça upload)

## Teste

1. Acesse seu site na Netlify
2. Abra o console (F12)
3. Verifique se as requisições estão indo para o backend correto
4. Teste login e chat

