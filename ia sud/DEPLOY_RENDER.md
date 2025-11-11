# Como Deployar o Backend no Render.com

## Passo a Passo Completo

### 1. Preparar o Repositório

Certifique-se de que seu código está no GitHub (ou GitLab/Bitbucket).

### 2. Criar Conta no Render

1. Acesse https://render.com
2. Clique em "Get Started for Free"
3. Faça login com GitHub

### 3. Criar Web Service

1. No dashboard, clique em "New" → "Web Service"
2. Conecte seu repositório
3. Configure:
   - **Name**: `iasud-backend`
   - **Region**: Escolha o mais próximo (ex: `Oregon (US West)`)
   - **Branch**: `main` (ou `master`)
   - **Root Directory**: Deixe vazio (ou `.` se necessário)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`

### 4. Adicionar Variáveis de Ambiente

Na seção "Environment Variables", adicione:

```
GEMINI_API_KEY=AIzaSyAUq7-LPBGwtn24jE-Vua4b0LhuJ5lysoc
GEMINI_API_KEYS=AIzaSyAUq7-LPBGwtn24jE-Vua4b0LhuJ5lysoc,AIzaSyAxofekdwK2CWdTc7fE0WDQWnR0eXluo2E,AIzaSyBsu6UtvtSCMwhRRGggJdOZ8zpudnv4wiA,AIzaSyCM0YLMmi1LPphO3Vjq12j7DzpsV1XJFD8,AIzaSyAlsQWeaGlkHI1thUZZPrhfHIPxI44y2y8
GOOGLE_CLIENT_ID=seu-client-id-aqui
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
SECRET_KEY=uma-chave-secreta-aleatoria-muito-longa
JWT_SECRET=outra-chave-secreta-aleatoria-muito-longa
```

### 5. Criar requirements.txt para Render

Certifique-se de que `requirements.txt` contém:

```
flask
flask-cors
python-dotenv
pyjwt
google-auth
google-auth-oauthlib
google-auth-httplib2
requests
gunicorn
```

### 6. Aguardar Deploy

Render irá:
1. Clonar seu repositório
2. Instalar dependências
3. Iniciar o servidor
4. Fornecer uma URL: `https://iasud-backend.onrender.com`

### 7. Atualizar Frontend

No arquivo `script.js`, linha 2, altere para:

```javascript
const API_BASE_URL = 'https://iasud-backend.onrender.com';
```

### 8. Atualizar Google OAuth

No Google Cloud Console:
- Adicione `https://iasud-backend.onrender.com/auth/google/callback` nas URIs de redirecionamento
- Adicione `https://iasud-backend.onrender.com` nas origens JavaScript autorizadas

### 9. Deploy do Frontend na Netlify

1. Acesse https://app.netlify.com
2. "Add new site" → "Deploy manually"
3. Faça upload de:
   - `index.html`
   - `script.js` (já atualizado com a URL do backend)
   - `style.css`
   - `igreja.webp`
   - `iago.png`
   - `gb.png`
   - `netlify.toml`

### 10. Testar

1. Acesse seu site na Netlify
2. Teste login e chat
3. Verifique o console (F12) para erros

## Notas Importantes

- Render tem um plano gratuito, mas o servidor "dorme" após 15 minutos de inatividade
- O primeiro request após dormir pode demorar ~30 segundos
- Para produção, considere um plano pago ou outro serviço
- Os dados em `data/` serão perdidos se o servidor reiniciar (considere usar banco de dados)

