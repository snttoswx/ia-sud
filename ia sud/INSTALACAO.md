# 🚀 Guia de Instalação Rápida - YASOUD

## Passo a Passo para Configurar

### 1. Instalar Python e Dependências

```bash
# Verificar se Python está instalado
python --version  # Deve ser 3.8 ou superior

# Instalar dependências
pip install -r requirements.txt
```

### 2. Obter Chaves de API

#### Google Gemini API:
1. Acesse: https://makersuite.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

#### Google OAuth (para login com Google):
1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Vá em "APIs e Serviços" > "Credenciais"
4. Clique em "Criar credenciais" > "ID do cliente OAuth 2.0"
5. Configure:
   - Tipo: Aplicativo da Web
   - Nome: YASOUD
   - URLs de redirecionamento autorizadas:
     - `http://localhost:5000/api/auth/google/callback` (desenvolvimento)
     - `https://seudominio.com/api/auth/google/callback` (produção)
6. Copie o "ID do cliente"

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Windows (PowerShell)
Copy-Item env.example .env

# Linux/Mac
cp env.example .env
```

Edite o arquivo `.env` e adicione suas chaves:

```env
SECRET_KEY=sua-chave-secreta-aqui-gere-uma-chave-aleatoria
JWT_SECRET=sua-chave-jwt-aqui-pode-ser-a-mesma-do-secret-key
GEMINI_API_KEY=sua-chave-gemini-aqui
GOOGLE_CLIENT_ID=seu-google-client-id-aqui
PORT=5000
FLASK_ENV=development
```

**Dica**: Para gerar chaves secretas seguras, use:
```python
import secrets
print(secrets.token_urlsafe(32))
```

### 4. Executar o Servidor

#### Desenvolvimento:
```bash
python app.py
```

#### Produção (com Gunicorn):
```bash
# Instalar Gunicorn (já está no requirements.txt)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### 5. Acessar a Aplicação

Abra seu navegador e acesse:
- `http://localhost:5000`

## 🔧 Deploy em Servidor (Hostinger/Hostgator)

### Opção 1: Usando Python no Servidor

1. **Fazer upload dos arquivos** via FTP ou cPanel File Manager

2. **Conectar via SSH** (se disponível):
```bash
cd public_html  # ou o diretório do seu site
```

3. **Instalar dependências**:
```bash
pip3 install -r requirements.txt --user
```

4. **Configurar variáveis de ambiente** no cPanel ou criar arquivo `.env`

5. **Executar com Gunicorn**:
```bash
gunicorn -w 2 -b 127.0.0.1:5000 app:app
```

6. **Configurar Apache/Nginx** para fazer proxy reverso para a porta 5000

### Opção 2: Usando cPanel Python App

1. No cPanel, vá em "Python App"
2. Crie uma nova aplicação Python
3. Configure:
   - Python Version: 3.8 ou superior
   - Application Root: diretório do projeto
   - Application URL: seu domínio
   - Application Entry point: `app:app`
4. Adicione as variáveis de ambiente no painel
5. Clique em "Run Pip Install" e instale as dependências

## ⚠️ Problemas Comuns

### Erro: "Module not found"
```bash
# Certifique-se de que está no diretório correto e instale as dependências
pip install -r requirements.txt
```

### Erro: "Port already in use"
```bash
# Altere a porta no .env ou mate o processo
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill
```

### Erro: "GEMINI_API_KEY not found"
- Verifique se o arquivo `.env` existe
- Confirme que as variáveis estão escritas corretamente
- Reinicie o servidor após alterar o `.env`

### Login com Google não funciona
- Verifique se o Client ID está correto
- Confirme que as URLs de redirecionamento estão configuradas no Google Console
- Certifique-se de que está usando HTTPS em produção

## 📞 Suporte

Se encontrar problemas, verifique:
1. Logs do servidor (console onde está rodando)
2. Console do navegador (F12 > Console)
3. Network tab (F12 > Network) para ver requisições

## ✅ Checklist Final

- [ ] Python 3.8+ instalado
- [ ] Dependências instaladas (`pip install -r requirements.txt`)
- [ ] Arquivo `.env` criado e configurado
- [ ] Chave Gemini API obtida e configurada
- [ ] Google OAuth configurado (se usar login Google)
- [ ] Servidor rodando sem erros
- [ ] Site acessível no navegador
- [ ] Login funcionando
- [ ] Chat com IA funcionando
- [ ] Reconhecimento de voz funcionando (Chrome/Edge)

