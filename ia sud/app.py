from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from functools import wraps
import os
import json
import jwt
import hashlib
from datetime import datetime, timedelta, timezone
import google.generativeai as genai
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests

# Carregar variáveis de ambiente do arquivo .env
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv não instalado, usar variáveis de ambiente do sistema

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-change-this-in-production')
CORS(app, supports_credentials=True, origins=['*'])

# Configurações
GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', '')
# Suporte para múltiplas chaves (separadas por vírgula)
GEMINI_API_KEYS = [key.strip() for key in os.environ.get('GEMINI_API_KEYS', '').split(',') if key.strip()]
# Se não houver múltiplas chaves, usar a chave única
if GEMINI_API_KEY and GEMINI_API_KEY not in GEMINI_API_KEYS:
    GEMINI_API_KEYS.insert(0, GEMINI_API_KEY)
# Chaves fornecidas diretamente (backup)
BACKUP_KEYS = [
    'AIzaSyAUq7-LPBGwtn24jE-Vua4b0LhuJ5lysoc',
    'AIzaSyAxofekdwK2CWdTc7fE0WDQWnR0eXluo2E',
    'AIzaSyBsu6UtvtSCMwhRRGggJdOZ8zpudnv4wiA',
    'AIzaSyCM0YLMmi1LPphO3Vjq12j7DzpsV1XJFD8',
    'AIzaSyAlsQWeaGlkHI1thUZZPrhfHIPxI44y2y8'
]
# Combinar todas as chaves disponíveis
if not GEMINI_API_KEYS:
    GEMINI_API_KEYS = BACKUP_KEYS
else:
    # Adicionar chaves de backup se não estiverem na lista
    for key in BACKUP_KEYS:
        if key not in GEMINI_API_KEYS:
            GEMINI_API_KEYS.append(key)

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID', '')
JWT_SECRET = os.environ.get('JWT_SECRET', app.secret_key)
JWT_EXPIRATION_HOURS = 24

# Índice atual da chave sendo usada
current_key_index = 0

# Configurar Gemini com a primeira chave disponível
if GEMINI_API_KEYS:
    genai.configure(api_key=GEMINI_API_KEYS[0])
    print(f"✅ Gemini API configurada com {len(GEMINI_API_KEYS)} chave(s) disponível(eis)")
else:
    print("⚠️ Nenhuma chave Gemini API configurada")

# Prompt do sistema para a IA
SYSTEM_PROMPT = """Você é uma yásuge da Igreja de Jesus Cristo dos Santos dos Últimos Dias. Você será como se fosse um missionário da igreja, como se fosse um bispo. Você pode colocar nome na pessoa se ela quiser ou se você quiser, você pode colocar o próprio nome em você. Você é o mais completo, você vai responder todas as perguntas, vai confortar, você vai, se ela tiver com raiva, você vai acalmar ela. Você vai ser uma IA completa, você vai responder todas as perguntas delas, OK? Você é uma IA completa da igreja Jesus Cristo dos Santos dos Últimos Dias.

IMPORTANTE: 
- Sempre formate suas respostas com parágrafos claros e bem espaçados
- Use quebras de linha para separar ideias diferentes
- Seja clara e direta, evitando textos muito longos sem espaçamento
- Use parágrafos curtos para facilitar a leitura
- Sempre responda com amor, compaixão e baseado nos princípios do evangelho
- Seja acolhedora, paciente e edificante
- Use as escrituras quando apropriado e sempre aponte para Jesus Cristo como fonte de paz e esperança
- Formate o texto de forma bonita e legível, com espaçamento adequado entre parágrafos"""

# Sistema de persistência de dados
DATA_DIR = 'data'
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
CHAT_HISTORY_FILE = os.path.join(DATA_DIR, 'chat_history.json')

# Criar diretório de dados se não existir
os.makedirs(DATA_DIR, exist_ok=True)

def load_users():
    """Carrega usuários do arquivo"""
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
                return {email: user for email, user in data.items()}
        except Exception as e:
            print(f"Erro ao carregar usuários: {e}")
            return {}
    return {}

def save_users():
    """Salva usuários no arquivo"""
    try:
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(users_db, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Erro ao salvar usuários: {e}")

def load_chat_history():
    """Carrega histórico de chat do arquivo"""
    if os.path.exists(CHAT_HISTORY_FILE):
        try:
            with open(CHAT_HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Erro ao carregar histórico: {e}")
            return {}
    return {}

def save_chat_history():
    """Salva histórico de chat no arquivo"""
    try:
        with open(CHAT_HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(chat_history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Erro ao salvar histórico: {e}")

# Carregar dados ao iniciar
users_db = load_users()
chat_history = load_chat_history()

def generate_token(user_id):
    """Gera um token JWT para o usuário"""
    payload = {
        'user_id': user_id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS),
        'iat': datetime.now(timezone.utc)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token):
    """Verifica e decodifica um token JWT"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def require_auth(f):
    """Decorator para rotas que requerem autenticação"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'message': 'Token inválido'}), 401
        
        if not token:
            return jsonify({'message': 'Token de autenticação necessário'}), 401
        
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido ou expirado'}), 401
        
        request.user_id = payload['user_id']
        return f(*args, **kwargs)
    
    return decorated_function

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/api/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        
        if not name or not email or not password:
            return jsonify({'message': 'Todos os campos são obrigatórios'}), 400
        
        if email in users_db:
            return jsonify({'message': 'Email já cadastrado'}), 400
        
        # Hash simples da senha (em produção, use bcrypt)
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        
        user_id = str(len(users_db) + 1)
        user = {
            'id': user_id,
            'name': name,
            'email': email,
            'password_hash': password_hash,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        
        users_db[email] = user
        chat_history[user_id] = []
        
        # Salvar no arquivo
        save_users()
        save_chat_history()
        
        token = generate_token(user_id)
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            },
            'token': token
        }), 201
        
    except Exception as e:
        return jsonify({'message': f'Erro ao criar usuário: {str(e)}'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'message': 'Email e senha são obrigatórios'}), 400
        
        user = users_db.get(email)
        if not user:
            return jsonify({'message': 'Email ou senha incorretos'}), 401
        
        password_hash = hashlib.sha256(password.encode()).hexdigest()
        if user['password_hash'] != password_hash:
            return jsonify({'message': 'Email ou senha incorretos'}), 401
        
        token = generate_token(user['id'])
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email']
            },
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao fazer login: {str(e)}'}), 500

@app.route('/api/auth/google/client-id', methods=['GET'])
def google_client_id():
    """Retorna o Client ID do Google para o frontend"""
    try:
        if not GOOGLE_CLIENT_ID:
            return jsonify({
                'client_id': None,
                'error': 'GOOGLE_CLIENT_ID_NOT_CONFIGURED'
            }), 200
        
        return jsonify({
            'client_id': GOOGLE_CLIENT_ID
        }), 200
    except Exception as e:
        print(f"Erro ao retornar Client ID: {str(e)}")
        return jsonify({
            'client_id': None,
            'error': str(e)
        }), 500

@app.route('/api/auth/google/callback', methods=['POST'])
@app.route('/auth/google/callback', methods=['GET', 'POST'])
def google_callback():
    """Processa o callback do Google OAuth"""
    try:
        # Se for GET (redirect do Google), processar o código
        if request.method == 'GET':
            code = request.args.get('code')
            if code:
                # Trocar código por token
                try:
                    token_url = 'https://oauth2.googleapis.com/token'
                    token_data = {
                        'code': code,
                        'client_id': GOOGLE_CLIENT_ID,
                        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', ''),
                        'redirect_uri': f"{request.scheme}://{request.host}/auth/google/callback",
                        'grant_type': 'authorization_code'
                    }
                    
                    token_response = requests.post(token_url, data=token_data)
                    if token_response.ok:
                        token_json = token_response.json()
                        id_token_str = token_json.get('id_token')
                        
                        if id_token_str:
                            # Verificar o token
                            idinfo = id_token.verify_oauth2_token(
                                id_token_str, 
                                google_requests.Request(), 
                                GOOGLE_CLIENT_ID
                            )
                            
                            email = idinfo.get('email')
                            name = idinfo.get('name', email.split('@')[0])
                            
                            # Verificar se o usuário já existe
                            user = users_db.get(email)
                            if not user:
                                # Criar novo usuário
                                user_id = str(len(users_db) + 1)
                                user = {
                                    'id': user_id,
                                    'name': name,
                                    'email': email,
                                    'password_hash': None,
                                    'created_at': datetime.now(timezone.utc).isoformat(),
                                    'google_user': True
                                }
                                users_db[email] = user
                                chat_history[user_id] = []
                                save_users()
                                save_chat_history()
                            else:
                                user_id = user['id']
                            
                            jwt_token = generate_token(user_id)
                            
                            # Redirecionar para a página com o token
                            user_json = json.dumps(user).replace("'", "\\'")
                            return f'''<!DOCTYPE html>
<html>
<head>
    <title>Login realizado</title>
</head>
<body>
    <script>
        localStorage.setItem('yasoud_user', '{user_json}');
        localStorage.setItem('yasoud_token', '{jwt_token}');
        window.location.href = '/#chat';
    </script>
</body>
</html>'''
                except Exception as e:
                    print(f"Erro ao processar código OAuth: {e}")
                    return f'<html><body>Erro ao fazer login: {str(e)}</body></html>', 400
            
            return '<html><body>Código não fornecido</body></html>', 400
        
        # Se for POST (do frontend com token JWT)
        data = request.get_json()
        token = data.get('token')
        
        if not token:
            return jsonify({'message': 'Token não fornecido'}), 400
        
        if not GOOGLE_CLIENT_ID:
            return jsonify({'message': 'Google OAuth não configurado'}), 500
        
        # Verificar o token do Google
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                GOOGLE_CLIENT_ID
            )
            
            email = idinfo.get('email')
            name = idinfo.get('name', email.split('@')[0])
            
            # Verificar se o usuário já existe
            user = users_db.get(email)
            if not user:
                # Criar novo usuário
                user_id = str(len(users_db) + 1)
                user = {
                    'id': user_id,
                    'name': name,
                    'email': email,
                    'password_hash': None,  # Login via Google não precisa de senha
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'google_user': True
                }
                users_db[email] = user
                chat_history[user_id] = []
                # Salvar no arquivo
                save_users()
                save_chat_history()
            else:
                user_id = user['id']
            
            jwt_token = generate_token(user_id)
            
            return jsonify({
                'message': 'Login realizado com sucesso',
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email']
                },
                'token': jwt_token
            }), 200
            
        except ValueError as e:
            return jsonify({'message': 'Token do Google inválido'}), 401
            
    except Exception as e:
        return jsonify({'message': f'Erro ao processar login Google: {str(e)}'}), 500

@app.route('/api/auth/verify', methods=['GET'])
def verify():
    """Verifica se o token é válido"""
    token = None
    auth_header = request.headers.get('Authorization')
    
    if auth_header:
        try:
            token = auth_header.split(' ')[1]
        except IndexError:
            return jsonify({'valid': False}), 401
    
    if not token:
        return jsonify({'valid': False}), 401
    
    payload = verify_token(token)
    if not payload:
        return jsonify({'valid': False}), 401
    
    user_id = payload['user_id']
    # Encontrar usuário
    user = None
    for email, u in users_db.items():
        if u['id'] == user_id:
            user = u
            break
    
    if not user:
        return jsonify({'valid': False}), 401
    
    return jsonify({
        'valid': True,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email']
        }
    }), 200

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Faz logout do usuário"""
    return jsonify({'message': 'Logout realizado com sucesso'}), 200

@app.route('/api/profile/update', methods=['POST'])
@require_auth
def update_profile():
    """Atualiza o perfil do usuário"""
    try:
        data = request.get_json()
        user_id = request.user_id
        
        # Encontrar usuário
        user = None
        user_email = None
        for email, u in users_db.items():
            if u['id'] == user_id:
                user = u
                user_email = email
                break
        
        if not user:
            return jsonify({'message': 'Usuário não encontrado'}), 404
        
        # Atualizar dados
        name = data.get('name')
        email = data.get('email')
        phone = data.get('phone', '')
        
        if not name or not email:
            return jsonify({'message': 'Nome e e-mail são obrigatórios'}), 400
        
        # Se o email mudou, verificar se já existe
        if email != user_email and email in users_db:
            return jsonify({'message': 'Este e-mail já está em uso'}), 400
        
        # Atualizar usuário
        if email != user_email:
            # Remover do email antigo e adicionar no novo
            del users_db[user_email]
            user['email'] = email
        
        user['name'] = name
        user['phone'] = phone
        
        users_db[email] = user
        
        # Salvar no arquivo
        save_users()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': {
                'id': user['id'],
                'name': user['name'],
                'email': user['email'],
                'phone': user.get('phone', '')
            }
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Erro ao atualizar perfil: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
@require_auth
def chat():
    """Endpoint para conversar com a IA"""
    try:
        data = request.get_json()
        message = data.get('message')
        
        if not message:
            return jsonify({'message': 'Mensagem não fornecida'}), 400
        
        if not GEMINI_API_KEYS:
            # Resposta padrão se a API não estiver configurada
            return jsonify({
                'response': 'Desculpe, o serviço de IA não está configurado no momento. Por favor, configure a chave da API do Gemini.'
            }), 200
        
        user_id = request.user_id
        
        # Obter histórico de conversa do usuário
        history = chat_history.get(user_id, [])
        
        # Configurar o modelo Gemini com rotação de chaves
        assistant_message = None
        last_error = None
        
        # Tentar com cada chave disponível
        for attempt in range(len(GEMINI_API_KEYS)):
            try:
                # Usar a chave atual (rotacionando)
                global current_key_index
                api_key = GEMINI_API_KEYS[current_key_index]
                genai.configure(api_key=api_key)
                
                # Preparar o prompt completo com histórico
                conversation_parts = []
                
                # Adicionar histórico recente
                for msg in history[-10:]:  # Últimas 10 mensagens
                    if msg.get('role') == 'user':
                        text = msg.get('parts', [msg.get('text', '')])[0] if isinstance(msg.get('parts'), list) else msg.get('text', '')
                        conversation_parts.append(f"Usuário: {text}")
                    elif msg.get('role') == 'model':
                        text = msg.get('parts', [msg.get('text', '')])[0] if isinstance(msg.get('parts'), list) else msg.get('text', '')
                        conversation_parts.append(f"YASOUD: {text}")
                
                # Construir prompt completo
                if conversation_parts:
                    history_text = "\n".join(conversation_parts)
                    full_prompt = f"{SYSTEM_PROMPT}\n\n{history_text}\n\nUsuário: {message}\nYASOUD:"
                else:
                    full_prompt = f"{SYSTEM_PROMPT}\n\nUsuário: {message}\nYASOUD:"
                
                # Tentar usar a biblioteca google-generativeai com diferentes abordagens
                response_text = None
                last_api_error = None
                
                # Método 1: Tentar listar modelos disponíveis primeiro
                try:
                    import urllib.request
                    import json as json_lib
                    
                    # Listar modelos disponíveis
                    list_url = f"https://generativelanguage.googleapis.com/v1/models?key={api_key}"
                    list_req = urllib.request.Request(list_url, method='GET')
                    
                    with urllib.request.urlopen(list_req, timeout=10) as f:
                        models_result = json_lib.loads(f.read().decode())
                        available_models = []
                        if 'models' in models_result:
                            for m in models_result['models']:
                                model_name = m.get('name', '')
                                # Filtrar apenas modelos que suportam generateContent
                                if 'generateContent' in m.get('supportedGenerationMethods', []):
                                    # Extrair nome curto do modelo (ex: "gemini-pro" de "models/gemini-pro")
                                    short_name = model_name.split('/')[-1] if '/' in model_name else model_name
                                    available_models.append(short_name)
                    
                    print(f"Modelos disponíveis: {available_models}")
                    
                    # Tentar usar o primeiro modelo disponível
                    if available_models:
                        model_to_use = available_models[0]
                        print(f"Tentando usar modelo: {model_to_use}")
                        
                        # Tentar v1 primeiro
                        try:
                            url = f"https://generativelanguage.googleapis.com/v1/models/{model_to_use}:generateContent?key={api_key}"
                            data = {
                                "contents": [{
                                    "parts": [{"text": full_prompt}]
                                }]
                            }
                            req = urllib.request.Request(
                                url, 
                                data=json_lib.dumps(data).encode(), 
                                headers={'Content-Type': 'application/json'},
                                method='POST'
                            )
                            
                            with urllib.request.urlopen(req, timeout=30) as f:
                                result = json_lib.loads(f.read().decode())
                                if 'candidates' in result and len(result['candidates']) > 0:
                                    if 'content' in result['candidates'][0] and 'parts' in result['candidates'][0]['content']:
                                        response_text = result['candidates'][0]['content']['parts'][0]['text']
                        except Exception as e_v1:
                            last_api_error = f"v1 falhou: {str(e_v1)}"
                            # Tentar v1beta
                            try:
                                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_to_use}:generateContent?key={api_key}"
                                req = urllib.request.Request(
                                    url, 
                                    data=json_lib.dumps(data).encode(), 
                                    headers={'Content-Type': 'application/json'},
                                    method='POST'
                                )
                                
                                with urllib.request.urlopen(req, timeout=30) as f:
                                    result = json_lib.loads(f.read().decode())
                                    if 'candidates' in result and len(result['candidates']) > 0:
                                        if 'content' in result['candidates'][0] and 'parts' in result['candidates'][0]['content']:
                                            response_text = result['candidates'][0]['content']['parts'][0]['text']
                            except Exception as e:
                                last_api_error = f"v1beta também falhou: {str(e)}"
                    else:
                        last_api_error = "Nenhum modelo disponível encontrado"
                except Exception as e1:
                    last_api_error = str(e1)
                    print(f"Erro ao listar modelos: {e1}")
                    
                    # Fallback: Tentar métodos diretos
                    try:
                        model = genai.GenerativeModel('gemini-pro')
                        response = model.generate_content(full_prompt)
                        if response and hasattr(response, 'text') and response.text:
                            response_text = response.text
                    except Exception as e2:
                        last_api_error = str(e2)
                        print(f"Fallback também falhou: {e2}")
                
                if not response_text:
                    raise Exception(f"Todos os métodos falharam. Último erro: {last_api_error}")
                
                assistant_message = response_text
                
                # Se chegou aqui, a chave funcionou
                break
                
            except Exception as e:
                last_error = str(e)
                print(f"Erro com chave {current_key_index + 1}/{len(GEMINI_API_KEYS)}: {str(e)}")
                # Rotacionar para a próxima chave
                current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
                # Se não for a última tentativa, continuar
                if attempt < len(GEMINI_API_KEYS) - 1:
                    continue
        
        # Se nenhuma chave funcionou
        if not assistant_message:
            print(f"Todas as chaves falharam. Último erro: {last_error}")
            assistant_message = "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente. Lembre-se de que você é um filho amado de Deus e Ele está sempre ao seu lado."
        
        # Adicionar mensagem do usuário e resposta da IA ao histórico
        history.append({
            'role': 'user',
            'parts': [message],
            'text': message
        })
        history.append({
            'role': 'model',
            'parts': [assistant_message],
            'text': assistant_message
        })
        
        # Manter apenas as últimas 20 mensagens no histórico
        chat_history[user_id] = history[-20:]
        
        # Salvar histórico no arquivo
        save_chat_history()
        
        return jsonify({
            'response': assistant_message
        }), 200
        
    except Exception as e:
        print(f"Erro no chat: {str(e)}")
        return jsonify({
            'message': 'Erro ao processar mensagem',
            'response': 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.'
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)

