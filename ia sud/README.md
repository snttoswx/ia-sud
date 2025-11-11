# YASOUD - Serva Digital do Senhor

Uma inteligência artificial missionária da Igreja de Jesus Cristo dos Santos dos Últimos Dias, criada para oferecer conforto, orientação espiritual e responder dúvidas baseadas nos princípios do evangelho.

## 🚀 Características

- **Chat com IA**: Conversas inteligentes usando Google Gemini API
- **Login com Google**: Autenticação via OAuth do Google
- **Reconhecimento de Voz**: Fale suas mensagens usando Web Speech API
- **Interface Moderna**: Design responsivo com tema claro/escuro
- **Histórico de Conversas**: Mantém o contexto das conversas
- **Animações Suaves**: Experiência visual agradável

## 📋 Pré-requisitos

- Python 3.8 ou superior
- Conta no Google Cloud Platform (para Gemini API e OAuth)
- Navegador moderno com suporte a Web Speech API (Chrome, Edge)

## 🔧 Instalação

1. **Clone ou baixe o projeto**

2. **Instale as dependências Python:**
```bash
pip install -r requirements.txt
```

3. **Configure as variáveis de ambiente:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas chaves:
- `GEMINI_API_KEY`: Obtenha em [Google AI Studio](https://makersuite.google.com/app/apikey)
- `GOOGLE_CLIENT_ID`: Configure em [Google Cloud Console](https://console.cloud.google.com/)
- `SECRET_KEY` e `JWT_SECRET`: Gere chaves aleatórias seguras

4. **Execute o servidor:**
```bash
python app.py
```

Ou em produção com Gunicorn:
```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

## 🌐 Deploy em Produção

### Hostinger / Hostgator

1. **Faça upload dos arquivos** para o servidor via FTP ou cPanel

2. **Configure o Python** no servidor (se necessário, use Python 3.8+)

3. **Instale as dependências:**
```bash
pip3 install -r requirements.txt
```

4. **Configure as variáveis de ambiente** no painel de controle ou via `.env`

5. **Configure o servidor web** (Apache/Nginx) para servir a aplicação Flask

6. **Para Apache**, adicione no `.htaccess`:
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /app.py/$1 [L]
```

## 🔑 Configuração do Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a API "Google+ API"
4. Vá em "Credenciais" > "Criar credenciais" > "ID do cliente OAuth 2.0"
5. Configure as URLs de redirecionamento autorizadas:
   - `http://localhost:5000/api/auth/google/callback` (desenvolvimento)
   - `https://seudominio.com/api/auth/google/callback` (produção)
6. Copie o Client ID e adicione no `.env`

## 📝 Estrutura do Projeto

```
.
├── app.py              # Servidor Flask (backend)
├── index.html          # Interface principal
├── script.js           # Lógica do frontend
├── style.css           # Estilos
├── requirements.txt    # Dependências Python
├── .env.example        # Exemplo de variáveis de ambiente
└── README.md          # Este arquivo
```

## 🎯 Uso

1. Acesse `http://localhost:5000` no navegador
2. Faça login com email/senha ou com Google
3. Comece a conversar com a YASOUD
4. Use o botão de microfone para falar suas mensagens

## 🔒 Segurança

- Use senhas fortes para `SECRET_KEY` e `JWT_SECRET`
- Nunca commite o arquivo `.env` no Git
- Use HTTPS em produção
- Configure CORS adequadamente para seu domínio

## 🐛 Solução de Problemas

### Erro ao conectar com Gemini API
- Verifique se a chave da API está correta no `.env`
- Confirme que a API está ativada no Google Cloud Console

### Login com Google não funciona
- Verifique se o Client ID está correto
- Confirme que as URLs de redirecionamento estão configuradas corretamente

### Reconhecimento de voz não funciona
- Use Chrome ou Edge (suporte melhor)
- Verifique as permissões do microfone no navegador
- HTTPS é necessário em produção para acesso ao microfone

## 📄 Licença

Este projeto é para uso pessoal e educacional.

## 🙏 Créditos

Desenvolvido com amor e dedicação para servir a comunidade da Igreja de Jesus Cristo dos Santos dos Últimos Dias.

