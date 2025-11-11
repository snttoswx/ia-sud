# ⚠️ SOLUÇÃO PARA ERROS NA NETLIFY

## Problema Identificado

A Netlify é uma plataforma de hospedagem **estática** e **NÃO executa Python/Flask**. Por isso você está vendo erros como:

- `❌ Erro ao carregar Client ID: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`
- `❌ Erro no registro: SyntaxError: Failed to execute 'json' on 'Response': Unexpected end of JSON input`
- `❌ Failed to load resource: the server responded with a status of 404`

## ✅ SOLUÇÃO: Backend Separado

Você precisa hospedar o **backend (app.py)** em um serviço que suporte Python e apontar o frontend para ele.

### Passo 1: Hospedar Backend no Render.com (GRATUITO)

1. **Acesse**: https://render.com
2. **Crie conta** (pode usar GitHub)
3. **Clique em "New" → "Web Service"**
4. **Conecte seu repositório** ou faça upload do código
5. **Configure**:
   ```
   Name: iasud-backend
   Environment: Python 3
   Build Command: pip install -r requirements.txt
   Start Command: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
   ```
6. **Adicione variáveis de ambiente**:
   - `GEMINI_API_KEY` (ou `GEMINI_API_KEYS` com todas as chaves separadas por vírgula)
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SECRET_KEY` (uma string aleatória longa)
   - `JWT_SECRET` (outra string aleatória longa)
7. **Render fornecerá uma URL**: `https://iasud-backend.onrender.com`

### Passo 2: Atualizar Frontend

Edite o arquivo `script.js` na **linha 2**:

```javascript
// ANTES:
const API_BASE_URL = window.location.origin;

// DEPOIS (substitua pela URL do seu backend no Render):
const API_BASE_URL = 'https://iasud-backend.onrender.com';
```

### Passo 3: Atualizar Google OAuth

No Google Cloud Console, adicione:

**URIs de redirecionamento autorizados:**
- `https://iasud-backend.onrender.com/auth/google/callback`

**Origens JavaScript autorizadas:**
- `https://iasud-backend.onrender.com`
- `https://seu-site.netlify.app` (URL do seu site na Netlify)

### Passo 4: Fazer Deploy na Netlify

1. **Acesse**: https://app.netlify.com
2. **"Add new site" → "Deploy manually"**
3. **Faça upload de uma pasta ZIP** com apenas:
   - ✅ `index.html`
   - ✅ `script.js` (já atualizado com a URL do backend)
   - ✅ `style.css`
   - ✅ `igreja.webp`
   - ✅ `iago.png`
   - ✅ `gb.png`
   - ✅ `netlify.toml`

**NÃO faça upload:**
- ❌ `app.py` (vai para Render)
- ❌ `requirements.txt` (vai para Render)
- ❌ `data/` (vai para Render)

### Passo 5: Testar

1. Acesse seu site na Netlify
2. Abra o console (F12)
3. Verifique se as requisições estão indo para `https://iasud-backend.onrender.com`
4. Teste login e chat

## Alternativas ao Render

- **Railway.app** (gratuito)
- **PythonAnywhere** (gratuito)
- **Heroku** (pago)
- **Vercel** (com funções serverless, mais complexo)

## Arquivos Necessários

### Para Netlify (Frontend):
- `index.html`
- `script.js`
- `style.css`
- `igreja.webp`
- `iago.png`
- `gb.png`
- `netlify.toml`

### Para Render (Backend):
- `app.py`
- `requirements.txt`
- `.env` (ou configure variáveis de ambiente no painel)

## Importante

- Render tem plano gratuito, mas o servidor "dorme" após 15 min de inatividade
- O primeiro request após dormir pode demorar ~30 segundos
- Para produção, considere um plano pago

