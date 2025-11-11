# Como Configurar o Login com Google

## Passo 1: Configurar Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto ou selecione um existente
3. Vá em **"APIs e Serviços"** → **"Credenciais"**
4. Clique em **"Criar Credenciais"** → **"ID do cliente OAuth"**
5. Configure:
   - **Tipo de aplicação**: Aplicação da Web
   - **Nome**: IASUD (ou qualquer nome)
   - **URIs de redirecionamento autorizados**: 
     - `http://localhost:5000/auth/google/callback` (para desenvolvimento)
     - `https://seudominio.com/auth/google/callback` (para produção)
   - **Origens JavaScript autorizadas** (IMPORTANTE - adicione também):
     - `http://localhost:5000` (para desenvolvimento)
     - `https://seudominio.com` (para produção)
     - Clique em "+ Adicionar URI" e adicione essas URLs

6. Copie o **Client ID** gerado

## Passo 2: Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto
2. Adicione a seguinte linha:
   ```
   GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
   ```
   Substitua `seu-client-id-aqui` pelo Client ID que você copiou

3. Salve o arquivo

## Passo 3: Reiniciar o Servidor

Após configurar o `.env`, reinicie o servidor Python:

```bash
python app.py
```

## Passo 4: Testar

1. Acesse o site
2. Clique no botão "Entrar com Google"
3. Selecione sua conta Google
4. Autorize o acesso
5. Você será redirecionado de volta e estará logado!

## Notas Importantes

- O Client ID deve ser exatamente como aparece no Google Cloud Console
- As URLs de redirecionamento devem corresponder exatamente (incluindo http/https e porta)
- Em produção, você precisará adicionar a URL do seu domínio nas configurações do Google Cloud Console
- O login com Google só funcionará se o `GOOGLE_CLIENT_ID` estiver configurado no arquivo `.env`

## Solução de Problemas

**Erro: "Login com Google não está disponível"**
- Verifique se o `GOOGLE_CLIENT_ID` está no arquivo `.env`
- Verifique se o servidor foi reiniciado após adicionar a variável

**Erro: "redirect_uri_mismatch"**
- Verifique se a URL de redirecionamento no Google Cloud Console corresponde exatamente à URL do seu servidor
- Para localhost, use: `http://localhost:5000/auth/google/callback`

**O botão do Google não aparece**
- Verifique o console do navegador (F12) para erros
- Certifique-se de que o script do Google está carregando corretamente

