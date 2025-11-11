// Configuração da API
// IMPORTANTE: Para Netlify, você precisa hospedar o backend (app.py) em outro serviço
// como Render.com, Railway.app ou PythonAnywhere, e colocar a URL aqui
// Exemplo: const API_BASE_URL = 'https://iasud-backend.onrender.com';
const API_BASE_URL = window.location.origin; // Use isso apenas se o backend estiver no mesmo domínio

// Configuração inicial
class YasoudApp {
    constructor() {
        this.currentUser = null;
        this.isLoggedIn = false;
        this.currentTheme = 'dark';
        this.messages = [];
        this.isRecording = false;
        this.recognition = null;
        this.recognitionTimeout = null; // Timeout para segurança
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupVoiceRecognition();
        this.setupGoogleSignIn();
        this.showLoading();
        this.checkAuth();
        this.loadTheme();
    }

    setupEventListeners() {
        // Navegação
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.getAttribute('href').substring(1));
            });
        });

        // Hamburger menu
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                hamburger.classList.toggle('active');
                navLinks.classList.toggle('active');
            });
        }

        // Forms de login/cadastro
        const showRegister = document.getElementById('showRegister');
        const showLogin = document.getElementById('showLogin');
        
        if (showRegister) {
            showRegister.addEventListener('click', (e) => {
                e.preventDefault();
                this.showRegisterForm();
            });
        }

        if (showLogin) {
            showLogin.addEventListener('click', (e) => {
                e.preventDefault();
                this.showLoginForm();
            });
        }

        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister();
            });
        }

        // Chat
        const sendMessage = document.getElementById('sendMessage');
        const messageInput = document.getElementById('messageInput');
        const voiceButton = document.getElementById('voiceButton');
        
        if (sendMessage) {
            sendMessage.addEventListener('click', () => {
                this.sendMessage();
            });
        }

        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (voiceButton) {
            voiceButton.addEventListener('click', () => {
                this.toggleVoiceRecognition();
            });
        }

        // Tema
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Limpar chat
        const clearChat = document.getElementById('clearChat');
        if (clearChat) {
            clearChat.addEventListener('click', () => {
                this.clearChat();
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Formulário de perfil
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleProfileUpdate();
            });
        }
    }

    setupVoiceRecognition() {
        // Verificar suporte do navegador
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            const voiceButton = document.getElementById('voiceButton');
            if (voiceButton) {
                voiceButton.style.display = 'none';
                console.warn('⚠️ Reconhecimento de voz não suportado neste navegador');
            }
            return;
        }

        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            // Configurações otimizadas
            this.recognition.lang = 'pt-BR';
            this.recognition.continuous = true;  // true para melhor detecção
            this.recognition.interimResults = true;  // true para feedback em tempo real
            this.recognition.maxAlternatives = 1;

            // Evento: início
            this.recognition.onstart = () => {
                console.log('✅ Reconhecimento iniciado com sucesso');
                this.isRecording = true;
                this.updateVoiceUI(true, '🎤 Ouvindo... Fale agora!');
            };

            // Evento: resultado
            this.recognition.onresult = (event) => {
                console.log('📝 Resultado recebido:', event);
                
                let finalTranscript = '';
                let interimTranscript = '';
                
                // Processar todos os resultados
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript + ' ';
                    } else {
                        interimTranscript += transcript;
                    }
                }
                
                // Mostrar resultado intermediário
                if (interimTranscript) {
                    this.updateVoiceUI(true, `🎤 Ouvindo: "${interimTranscript}"`);
                }
                
                // Processar resultado final
                if (finalTranscript.trim()) {
                    console.log('✅ Texto final reconhecido:', finalTranscript.trim());
                    this.processVoiceResult(finalTranscript.trim());
                }
            };

            // Evento: erro
            this.recognition.onerror = (event) => {
                console.error('❌ Erro no reconhecimento:', event.error, event);
                this.handleRecognitionError(event.error);
            };

            // Evento: fim
            this.recognition.onend = () => {
                console.log('⏹️ Reconhecimento finalizado');
                
                // Se ainda estiver gravando, reiniciar automaticamente
                if (this.isRecording) {
                    console.log('🔄 Reiniciando reconhecimento...');
                    try {
                        this.recognition.start();
                    } catch (e) {
                        console.log('Reconhecimento já parado ou erro ao reiniciar:', e);
                        this.isRecording = false;
                        this.resetVoiceUI();
                    }
                } else {
                    this.resetVoiceUI();
                }
            };

            console.log('✅ Reconhecimento de voz configurado com sucesso');
        } catch (error) {
            console.error('❌ Erro ao configurar reconhecimento:', error);
            const voiceButton = document.getElementById('voiceButton');
            if (voiceButton) {
                voiceButton.style.display = 'none';
            }
            this.showNotification('Erro ao configurar reconhecimento de voz. Use Chrome ou Edge.', 'error');
        }
    }

    updateVoiceUI(isRecording, statusText = '') {
        const voiceButton = document.getElementById('voiceButton');
        const voiceStatus = document.getElementById('voiceStatus');
        
        if (voiceButton) {
            if (isRecording) {
                voiceButton.classList.add('recording');
                voiceButton.setAttribute('title', 'Parar gravação');
            } else {
                voiceButton.classList.remove('recording');
                voiceButton.setAttribute('title', 'Falar');
            }
        }
        
        if (voiceStatus) {
            if (statusText) {
                voiceStatus.textContent = statusText;
                voiceStatus.classList.add('active');
            } else {
                voiceStatus.textContent = '';
                voiceStatus.classList.remove('active');
            }
        }
    }

    resetVoiceUI() {
        this.updateVoiceUI(false, '');
    }

    processVoiceResult(transcript) {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;
        
        messageInput.value = transcript;
        this.updateVoiceUI(false, '✅ Texto reconhecido! Enviando...');
        
        // Enviar após pequeno delay
        setTimeout(() => {
            this.sendMessage();
            this.resetVoiceUI();
        }, 300);
    }

    handleRecognitionError(error) {
        // Erros que não precisam notificar o usuário
        if (error === 'aborted' || error === 'no-speech') {
            this.stopVoiceRecognition();
            return;
        }
        
        // Mapear erros para mensagens amigáveis
        const errorMessages = {
            'audio-capture': 'Não foi possível acessar o microfone. Verifique as permissões.',
            'not-allowed': 'Permissão de microfone negada. Permita o acesso nas configurações do navegador.',
            'network': 'Problema de conexão com o serviço de reconhecimento. Verifique sua internet e tente novamente.',
            'service-not-allowed': 'Serviço de reconhecimento não disponível.',
            'bad-grammar': 'Erro na gramática do reconhecimento.',
            'language-not-supported': 'Idioma não suportado.'
        };
        
        const message = errorMessages[error] || `Erro: ${error}. Tente novamente.`;
        
        // Para erro de rede, não mostrar notificação imediatamente (pode ser falso positivo)
        if (error === 'network') {
            console.warn('⚠️ Erro de rede detectado, mas pode ser temporário');
            this.updateVoiceUI(false, '⚠️ Erro de conexão. Tente novamente.');
            setTimeout(() => this.resetVoiceUI(), 3000);
        } else {
            this.showNotification(message, 'error');
            this.stopVoiceRecognition();
        }
    }

    resetVoiceUI() {
        const voiceButton = document.getElementById('voiceButton');
        const voiceStatus = document.getElementById('voiceStatus');
        if (voiceButton) {
            voiceButton.classList.remove('recording');
            voiceButton.setAttribute('title', 'Falar');
        }
        if (voiceStatus) {
            voiceStatus.textContent = '';
            voiceStatus.classList.remove('active');
        }
    }

    async toggleVoiceRecognition() {
        console.log('🎤 toggleVoiceRecognition chamado');
        
        // Verificação básica: login
        if (!this.isLoggedIn) {
            this.showNotification('Por favor, faça login para usar o reconhecimento de voz.', 'error');
            return;
        }

        // Verificação básica: disponibilidade
        if (!this.recognition) {
            console.error('❌ Reconhecimento não disponível');
            this.showNotification('Reconhecimento de voz não disponível. Use Chrome ou Edge.', 'error');
            return;
        }

        // Se já estiver gravando, parar
        if (this.isRecording) {
            console.log('⏹️ Parando reconhecimento...');
            this.stopVoiceRecognition();
            return;
        }

        // Verificação básica: contexto seguro (HTTPS ou localhost)
        const isSecure = window.location.protocol === 'https:' || 
                        ['localhost', '127.0.0.1', '', '0.0.0.0'].includes(window.location.hostname);
        
        if (!isSecure) {
            console.warn('⚠️ Contexto não seguro');
            this.showNotification('Reconhecimento requer HTTPS ou localhost.', 'error');
            return;
        }

        // Iniciar reconhecimento diretamente (SpeechRecognition gerencia o microfone)
        try {
            console.log('🚀 Tentando iniciar reconhecimento...');
            
            // Limpar qualquer timeout anterior
            if (this.recognitionTimeout) {
                clearTimeout(this.recognitionTimeout);
            }
            
            this.recognition.start();
            console.log('✅ Comando start() executado');
            
            // Timeout de segurança (60 segundos)
            this.recognitionTimeout = setTimeout(() => {
                if (this.isRecording) {
                    console.warn('⏱️ Timeout: parando reconhecimento');
                    this.stopVoiceRecognition();
                    this.showNotification('Tempo limite excedido. Tente novamente.', 'error');
                }
            }, 60000);
            
        } catch (error) {
            console.error('❌ Erro ao iniciar:', error.name, error.message);
            
            // Tratar erro de estado inválido (já está rodando)
            if (error.name === 'InvalidStateError' || error.message?.includes('already started')) {
                console.log('🔄 Reconhecimento já está rodando, reiniciando...');
                try {
                    this.recognition.stop();
                    await new Promise(resolve => setTimeout(resolve, 500));
                    this.recognition.start();
                } catch (retryError) {
                    console.error('❌ Erro ao reiniciar:', retryError);
                    this.showNotification('Erro ao iniciar reconhecimento. Tente novamente.', 'error');
                }
            } else if (error.name === 'NotAllowedError' || error.message?.includes('not allowed')) {
                this.showNotification('Permissão de microfone negada. Permita o acesso nas configurações do navegador (ícone de cadeado na barra de endereço).', 'error');
            } else {
                this.showNotification(`Erro ao iniciar reconhecimento: ${error.message || error.name}`, 'error');
            }
        }
    }

    stopVoiceRecognition() {
        console.log('⏹️ Parando reconhecimento...');
        
        // Limpar timeout se existir
        if (this.recognitionTimeout) {
            clearTimeout(this.recognitionTimeout);
            this.recognitionTimeout = null;
        }
        
        // Marcar como não gravando
        this.isRecording = false;
        
        // Parar reconhecimento
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                // Ignorar erro se já estiver parado
                console.log('Reconhecimento já parado ou erro ao parar:', error);
            }
        }
        
        // Resetar UI
        this.resetVoiceUI();
    }

    setupGoogleSignIn() {
        // Carregar Client ID do servidor e inicializar Google Sign-In
        this.loadGoogleClientId();
    }

    async loadGoogleClientId() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/google/client-id`, {
                method: 'GET',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.client_id) {
                // Inicializar Google Sign-In quando o script carregar
                window.addEventListener('load', () => {
                    if (window.google && window.google.accounts) {
                        // Atualizar o div com o client_id
                        const gIdOnload = document.getElementById('g_id_onload');
                        if (gIdOnload) {
                            gIdOnload.setAttribute('data-client_id', data.client_id);
                        }
                        
                        window.google.accounts.id.initialize({
                            client_id: data.client_id,
                            callback: this.handleGoogleCallback.bind(this)
                        });
                        
                        // Renderizar o botão do Google
                        window.google.accounts.id.renderButton(
                            document.querySelector('.g_id_signin'),
                            {
                                theme: 'outline',
                                size: 'large',
                                text: 'signin_with',
                                shape: 'rectangular',
                                logo_alignment: 'left'
                            }
                        );
                    }
                });
                
                // Se o Google já carregou, inicializar imediatamente
                if (window.google && window.google.accounts) {
                    const gIdOnload = document.getElementById('g_id_onload');
                    if (gIdOnload) {
                        gIdOnload.setAttribute('data-client_id', data.client_id);
                    }
                    
                    window.google.accounts.id.initialize({
                        client_id: data.client_id,
                        callback: this.handleGoogleCallback.bind(this)
                    });
                    
                    const signinDiv = document.querySelector('.g_id_signin');
                    if (signinDiv) {
                        window.google.accounts.id.renderButton(signinDiv, {
                            theme: 'outline',
                            size: 'large',
                            text: 'signin_with',
                            shape: 'rectangular',
                            logo_alignment: 'left'
                        });
                    }
                }
            } else {
                // Se não tiver Client ID, esconder o botão do Google
                const signinDiv = document.querySelector('.g_id_signin');
                if (signinDiv) {
                    signinDiv.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Erro ao carregar Client ID:', error);
            const signinDiv = document.querySelector('.g_id_signin');
            if (signinDiv) {
                signinDiv.style.display = 'none';
            }
        }
    }

    async handleGoogleCallback(response) {
        try {
            console.log('Google callback recebido:', response);
            
            const res = await fetch(`${API_BASE_URL}/api/auth/google/callback`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ token: response.credential })
            });

            if (res.ok) {
                const data = await res.json();
                this.currentUser = data.user;
                this.isLoggedIn = true;
                localStorage.setItem('yasoud_user', JSON.stringify(this.currentUser));
                localStorage.setItem('yasoud_token', data.token);
                this.showNotification('Login realizado com sucesso!', 'success');
                this.showChat();
            } else {
                const errorData = await res.json();
                this.showNotification(errorData.message || 'Erro ao fazer login com Google.', 'error');
            }
        } catch (error) {
            console.error('Erro no callback Google:', error);
            this.showNotification('Erro ao processar login.', 'error');
        }
    }

    showLoading() {
        setTimeout(() => {
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.opacity = '0';
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 500);
            }
        }, 1500);
    }

    async checkAuth() {
        const savedUser = localStorage.getItem('yasoud_user');
        const savedToken = localStorage.getItem('yasoud_token');
        
        if (savedUser && savedToken) {
            try {
                // Verificar se o token ainda é válido
                const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${savedToken}`
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    this.currentUser = JSON.parse(savedUser);
                    this.isLoggedIn = true;
                    this.showChat();
                } else {
                    // Token inválido, fazer logout
                    this.handleLogout();
                }
            } catch (error) {
                console.error('Erro ao verificar autenticação:', error);
                // Em caso de erro, tentar usar dados salvos localmente
                this.currentUser = JSON.parse(savedUser);
                this.isLoggedIn = true;
                this.showChat();
            }
        } else {
            this.showLogin();
        }
    }

    showLogin() {
        this.hideAllSections();
        const loginSection = document.getElementById('login');
        if (loginSection) {
            loginSection.classList.add('active');
        }
        this.updateNavigation('home');
    }

    showChat() {
        this.hideAllSections();
        const chatSection = document.getElementById('chat');
        if (chatSection) {
            chatSection.classList.add('active');
        }
        this.updateNavigation('chat');
        this.loadChatHistory();
    }

    showAbout() {
        this.hideAllSections();
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            aboutSection.classList.add('active');
        }
        this.updateNavigation('about');
    }

    async showProfile() {
        this.hideAllSections();
        const profileSection = document.getElementById('profile');
        if (profileSection) {
            profileSection.classList.add('active');
        }
        this.updateNavigation('profile');
        
        // Carregar dados do usuário atual
        if (this.currentUser) {
            const profileName = document.getElementById('profileName');
            const profileEmail = document.getElementById('profileEmail');
            const profilePhone = document.getElementById('profilePhone');
            if (profileName) profileName.value = this.currentUser.name || '';
            if (profileEmail) profileEmail.value = this.currentUser.email || '';
            if (profilePhone) profilePhone.value = this.currentUser.phone || '';
        }
    }

    showCredits() {
        this.hideAllSections();
        const creditsSection = document.getElementById('credits');
        if (creditsSection) {
            creditsSection.classList.add('active');
        }
        this.updateNavigation('credits');
    }

    hideAllSections() {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
    }

    updateNavigation(section) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        const activeLink = document.querySelector(`.nav-link[href="#${section}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }

    navigateTo(section) {
        if (!this.isLoggedIn && section !== 'home' && section !== 'about') {
            this.showLogin();
            return;
        }

        switch(section) {
            case 'home':
                this.showLogin();
                break;
            case 'chat':
                this.showChat();
                break;
            case 'about':
                this.showAbout();
                break;
            case 'profile':
                this.showProfile();
                break;
            case 'credits':
                this.showCredits();
                break;
        }

        // Fechar menu mobile se aberto
        const hamburger = document.querySelector('.hamburger');
        const navLinks = document.querySelector('.nav-links');
        if (hamburger) hamburger.classList.remove('active');
        if (navLinks) navLinks.classList.remove('active');
    }

    showLoginForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm) loginForm.classList.add('active');
        if (registerForm) registerForm.classList.remove('active');
    }

    showRegisterForm() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm) loginForm.classList.remove('active');
        if (registerForm) registerForm.classList.add('active');
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showNotification('Por favor, preencha todos os campos.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isLoggedIn = true;
                localStorage.setItem('yasoud_user', JSON.stringify(this.currentUser));
                localStorage.setItem('yasoud_token', data.token);
                this.showNotification('Login realizado com sucesso!', 'success');
                this.showChat();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Erro ao fazer login.', 'error');
            }
        } catch (error) {
            console.error('Erro no login:', error);
            this.showNotification('Erro ao conectar com o servidor.', 'error');
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirm').value;

        if (!name || !email || !password || !confirmPassword) {
            this.showNotification('Por favor, preencha todos os campos.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('As senhas não coincidem.', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('A senha deve ter pelo menos 6 caracteres.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name, email, password })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                this.isLoggedIn = true;
                localStorage.setItem('yasoud_user', JSON.stringify(this.currentUser));
                localStorage.setItem('yasoud_token', data.token);
                this.showNotification('Conta criada com sucesso! Bem-vindo à IASUD.', 'success');
                this.showChat();
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Erro ao criar conta.', 'error');
            }
        } catch (error) {
            console.error('Erro no registro:', error);
            this.showNotification('Erro ao conectar com o servidor.', 'error');
        }
    }

    async handleProfileUpdate() {
        const name = document.getElementById('profileName').value;
        const email = document.getElementById('profileEmail').value;
        const phone = document.getElementById('profilePhone').value;

        if (!name || !email) {
            this.showNotification('Nome e e-mail são obrigatórios.', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('yasoud_token');
            const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ name, email, phone })
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.user;
                localStorage.setItem('yasoud_user', JSON.stringify(this.currentUser));
                this.showNotification('Perfil atualizado com sucesso!', 'success');
            } else {
                const error = await response.json();
                this.showNotification(error.message || 'Erro ao atualizar perfil.', 'error');
            }
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            this.showNotification('Erro ao conectar com o servidor.', 'error');
        }
    }

    handleLogout() {
        this.isLoggedIn = false;
        this.currentUser = null;
        localStorage.removeItem('yasoud_user');
        localStorage.removeItem('yasoud_token');
        this.messages = [];
        localStorage.removeItem('yasoud_chat_history');
        
        // Fazer logout no servidor
        fetch(`${API_BASE_URL}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include'
        }).catch(err => console.error('Erro no logout:', err));
        
        this.showNotification('Logout realizado com sucesso.', 'success');
        this.showLogin();
    }

    async sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;

        // Adicionar mensagem do usuário
        this.addMessage(message, 'user');
        input.value = '';

        // Mostrar indicador de digitação
        this.showTypingIndicator();

        try {
            const token = localStorage.getItem('yasoud_token');
            const response = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ message })
            });

            if (response.ok) {
                const data = await response.json();
                this.hideTypingIndicator();
                this.addMessage(data.response, 'assistant');
            } else {
                this.hideTypingIndicator();
                const error = await response.json();
                this.showNotification(error.message || 'Erro ao enviar mensagem.', 'error');
                this.addMessage('Desculpe, ocorreu um erro. Por favor, tente novamente.', 'assistant');
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            this.hideTypingIndicator();
            this.showNotification('Erro ao conectar com o servidor.', 'error');
            this.addMessage('Desculpe, não consegui me conectar. Verifique sua conexão e tente novamente.', 'assistant');
        }
    }

    addMessage(text, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const time = new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });

        // Formatar texto: converter quebras de linha em <br> e criar parágrafos
        let formattedText = this.escapeHtml(text);
        
        // Se for mensagem da IA, formatar melhor
        if (sender === 'assistant') {
            // Dividir em parágrafos (duas quebras de linha)
            formattedText = formattedText.split(/\n\n+/).map(para => {
                // Se o parágrafo tiver múltiplas linhas, juntar com <br>
                para = para.split('\n').join('<br>');
                return `<p>${para}</p>`;
            }).join('');
        } else {
            // Para mensagens do usuário, apenas converter quebras de linha
            formattedText = formattedText.split('\n').join('<br>');
        }

        messageDiv.innerHTML = `
            <div class="message-text">${formattedText}</div>
            <div class="message-time">${time}</div>
        `;

        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // Salvar mensagem no histórico
        this.messages.push({
            text,
            sender,
            timestamp: new Date().toISOString()
        });

        this.saveChatHistory();
    }

    showTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        const messagesContainer = document.getElementById('chatMessages');
        if (indicator) indicator.style.display = 'flex';
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) indicator.style.display = 'none';
    }

    clearChat() {
        if (confirm('Tem certeza que deseja limpar o histórico desta conversa?')) {
            this.messages = [];
            const messagesContainer = document.getElementById('chatMessages');
            if (messagesContainer) messagesContainer.innerHTML = '';
            localStorage.removeItem('yasoud_chat_history');
            this.showNotification('Conversa limpa com sucesso.', 'success');
        }
    }

    loadChatHistory() {
        const savedHistory = localStorage.getItem('yasoud_chat_history');
        if (savedHistory) {
            try {
                const parsed = JSON.parse(savedHistory);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.messages = parsed;
                    this.renderChatHistory();
                } else {
                    // Mensagem de boas-vindas inicial
                    setTimeout(() => {
                        this.addMessage("Que a paz do Senhor esteja com você! Sou a IASUD, uma missionária virtual da Igreja de Jesus Cristo dos Santos dos Últimos Dias. Como posso ajudá-lo hoje?", 'assistant');
                    }, 500);
                }
            } catch (error) {
                console.error('Erro ao carregar histórico:', error);
                this.messages = [];
                // Mensagem de boas-vindas inicial
                setTimeout(() => {
                    this.addMessage("Que a paz do Senhor esteja com você! Sou a YASOUD, uma missionária virtual da Igreja de Jesus Cristo dos Santos dos Últimos Dias. Como posso ajudá-lo hoje?", 'assistant');
                }, 500);
            }
        } else {
            // Mensagem de boas-vindas inicial
            setTimeout(() => {
                this.addMessage("Que a paz do Senhor esteja com você! Sou a YASOUD, uma missionária virtual da Igreja de Jesus Cristo dos Santos dos Últimos Dias. Como posso ajudá-lo hoje?", 'assistant');
            }, 500);
        }
    }

    renderChatHistory() {
        const messagesContainer = document.getElementById('chatMessages');
        if (!messagesContainer) return;
        
        messagesContainer.innerHTML = '';

        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${msg.sender}`;
            
            const time = new Date(msg.timestamp).toLocaleTimeString('pt-BR', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });

            // Formatar texto do histórico também
            let formattedText = this.escapeHtml(msg.text);
            
            if (msg.sender === 'assistant') {
                formattedText = formattedText.split(/\n\n+/).map(para => {
                    para = para.split('\n').join('<br>');
                    return `<p>${para}</p>`;
                }).join('');
            } else {
                formattedText = formattedText.split('\n').join('<br>');
            }

            messageDiv.innerHTML = `
                <div class="message-text">${formattedText}</div>
                <div class="message-time">${time}</div>
            `;

            messagesContainer.appendChild(messageDiv);
        });

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    saveChatHistory() {
        localStorage.setItem('yasoud_chat_history', JSON.stringify(this.messages));
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('yasoud_theme', this.currentTheme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
        
        this.showNotification(`Tema ${this.currentTheme === 'dark' ? 'escuro' : 'claro'} ativado`, 'success');
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('yasoud_theme') || 'dark';
        this.currentTheme = savedTheme;
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = this.currentTheme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
        }
    }

    showNotification(message, type) {
        // Criar elemento de notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Estilos da notificação
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            max-width: 300px;
        `;

        document.body.appendChild(notification);

        // Animação de entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover após 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Função global para o callback do Google (necessária para o script do Google)
function handleGoogleLogin(response) {
    if (window.yasoudApp) {
        window.yasoudApp.handleGoogleCallback(response);
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.yasoudApp = new YasoudApp();
});
