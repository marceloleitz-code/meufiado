// Configuração do Firebase - SUBSTITUA com as credenciais do seu projeto
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO_ID",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};

// Inicializar o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const messaging = firebase.messaging();

// Estado global para o app
const appState = {
    notifications: [],
    userType: 'client'
};

// Solicitar permissão para notificações
function requestNotificationPermission() {
    console.log('Solicitando permissão...');
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Permissão de notificação concedida.');
            // Obter o token de registro
            messaging.getToken({vapidKey: "SUA_CHAVE_VAPID_AQUI"}).then((currentToken) => {
                if (currentToken) {
                    console.log('Token:', currentToken);
                    // Salvar o token no Firestore
                    saveTokenToFirestore(currentToken);
                } else {
                    console.log('Não foi possível obter o token de notificação.');
                }
            }).catch((err) => {
                console.log('Ocorreu um erro ao recuperar o token:', err);
            });
        } else {
            console.log('Permissão de notificação negada.');
        }
    });
}

// Salvar token no Firestore
function saveTokenToFirestore(token) {
    // Para um app real, você usaria o ID de usuário do seu sistema
    const userRef = db.collection('users').doc('cliente123');
    userRef.set({
        messagingToken: token,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        console.log('Token salvo com sucesso!');
    })
    .catch((error) => {
        console.error('Erro ao salvar token:', error);
    });
}

// Escutar mensagens em primeiro plano
messaging.onMessage((payload) => {
    console.log('Mensagem recebida em primeiro plano:', payload);
    
    // Adicionar notificação ao estado local
    const newNotification = {
        title: payload.notification.title,
        content: payload.notification.body,
        time: new Date().toLocaleTimeString()
    };
    
    appState.notifications.unshift(newNotification);
    updateNotificationBadge();
    
    // Mostrar notificação
    if (Notification.permission === 'granted') {
        new Notification(payload.notification.title, {
            body: payload.notification.body,
            icon: '/icon.png' // Altere para o caminho do seu ícone
        });
    }
});

// Funções para gerenciar a interface do usuário
function renderView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    
    if (viewName === 'notifications') {
        document.getElementById('notifications-view').classList.remove('hidden');
        renderNotifications();
    } else if (appState.userType === 'client') {
        document.getElementById('client-view').classList.remove('hidden');
    } else {
        document.getElementById('merchant-view').classList.remove('hidden');
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        }
    });
}

function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const count = appState.notifications.length;
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

function renderNotifications() {
    const list = document.getElementById('notifications-list');
    list.innerHTML = '';
    
    if (appState.notifications.length === 0) {
        list.innerHTML = `
            <div class="help-text">
                <i class="far fa-bell"></i>
                <p>Nenhuma notificação por enquanto.</p>
            </div>
        `;
        return;
    }
    
    appState.notifications.forEach(notif => {
        const item = document.createElement('div');
        item.classList.add('notification-item');
        item.innerHTML = `
            <div class="notification-title">${notif.title}</div>
            <div class="notification-content">${notif.content}</div>
            <div class="notification-time">${notif.time}</div>
        `;
        list.appendChild(item);
    });
}

// Eventos
document.getElementById('client-btn').addEventListener('click', function() {
    appState.userType = 'client';
    this.classList.add('active');
    document.getElementById('merchant-btn').classList.remove('active');
    renderView('home');
});

document.getElementById('merchant-btn').addEventListener('click', function() {
    appState.userType = 'merchant';
    this.classList.add('active');
    document.getElementById('client-btn').classList.remove('active');
    renderView('home');
});

document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        const parent = this.closest('.tabs');
        parent.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        const tabName = this.getAttribute('data-tab');
        const tabContainer = this.closest('.tab-content');
        
        tabContainer.querySelectorAll('[id$="-tab"]').forEach(tabContent => {
            tabContent.classList.add('hidden');
        });
        
        tabContainer.querySelector(`#${tabName}-tab`).classList.remove('hidden');
    });
});

document.getElementById('login-btn').addEventListener('click', function() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    
    // Solicitar permissão para notificações após o login
    requestNotificationPermission();
    
    renderView('home');
    alert('Login realizado com sucesso!');
});

// Função para registrar a venda no Firestore
document.getElementById('register-sale-btn').addEventListener('click', function() {
    const clientName = document.getElementById('client-select').value;
    const value = document.getElementById('sale-value').value;
    const description = document.getElementById('sale-description').value;
    
    if (clientName && value > 0) {
        // Adicionar um novo documento com um ID gerado automaticamente
        db.collection('transactions').add({
            clientName: clientName,
            value: parseFloat(value),
            description: description,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then((docRef) => {
            console.log("Documento escrito com ID: ", docRef.id);
            alert(`Venda para ${clientName} no valor de R$${value} registrada com sucesso.`);
            
            // Limpar formulário
            document.getElementById('sale-value').value = '';
            document.getElementById('sale-description').value = '';
        })
        .catch((error) => {
            console.error("Erro ao adicionar documento: ", error);
            alert("Erro ao registrar venda. Tente novamente.");
        });
    } else {
        alert('Por favor, selecione um cliente e insira um valor válido.');
    }
});

// Navegação inferior
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const view = this.getAttribute('data-view');
        renderView(view);
    });
});

// Simular notificações para demonstração (remova em produção)
function simulateNotification() {
    const notifications = [
        {
            title: 'Pagamento Recebido',
            content: 'João Santos realizou um pagamento de R$ 50,00'
        },
        {
            title: 'Nova Compra',
            content: 'Maria Silva realizou uma compra de R$ 35,50'
        },
        {
            title: 'Fiado em Atraso',
            content: 'Pedro Costa está com pagamento atrasado há 5 dias'
        }
    ];
    
    const randomNotif = notifications[Math.floor(Math.random() * notifications.length)];
    randomNotif.time = new Date().toLocaleTimeString();
    
    appState.notifications.unshift(randomNotif);
    updateNotificationBadge();
    
    // Mostrar notificação real se permitido
    if (Notification.permission === 'granted') {
        new Notification(randomNotif.title, {
            body: randomNotif.content,
            icon: 'https://example.com/icon.png' // URL do ícone
        });
    }
}

// Simular notificação a cada 30 segundos para demonstração
setInterval(simulateNotification, 30000);
