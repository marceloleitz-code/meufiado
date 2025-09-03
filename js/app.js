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
const auth = firebase.auth();
const messaging = firebase.messaging();

// Estado global para o app
const appState = {
    notifications: [],
    userType: 'client',
    currentUser: null,
    customers: [],
    transactions: [],
    currentSaleProducts: []
};

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para atualizar o resumo da venda
function updateSaleSummary() {
    const totalItems = appState.currentSaleProducts.reduce((sum, product) => sum + product.quantity, 0);
    const totalValue = appState.currentSaleProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
}

// Função para renderizar a lista de produtos
function renderProductsList() {
    const container = document.getElementById('products-list');
    
    if (appState.currentSaleProducts.length === 0) {
        container.innerHTML = `
            <div class="help-text">
                <i class="fas fa-shopping-cart"></i>
                <p>Nenhum produto adicionado ainda.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    appState.currentSaleProducts.forEach((product, index) => {
        const productElement = document.createElement('div');
        productElement.className = 'product-item';
        productElement.innerHTML = `
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-details">
                    <span>Qtd: ${product.quantity}</span>
                    <span>Preço: ${formatCurrency(product.price)}</span>
                    <span>Total: ${formatCurrency(product.price * product.quantity)}</span>
                </div>
            </div>
            <div class="product-actions">
                <button class="product-action-btn edit-product" data-index="${index}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="product-action-btn delete-product" data-index="${index}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        container.appendChild(productElement);
    });
    
    // Adicionar event listeners para os botões
    document.querySelectorAll('.edit-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            editProduct(index);
        });
    });
    
    document.querySelectorAll('.delete-product').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = e.currentTarget.getAttribute('data-index');
            deleteProduct(index);
        });
    });
    
    updateSaleSummary();
}

// Função para adicionar produto
function addProduct() {
    const name = document.getElementById('product-name').value.trim();
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const price = parseFloat(document.getElementById('product-price').value);
    
    if (!name || isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const product = {
        id: Date.now(), // ID único para o produto
        name: name,
        quantity: quantity,
        price: price
    };
    
    appState.currentSaleProducts.push(product);
    renderProductsList();
    
    // Limpar o formulário
    document.getElementById('product-name').value = '';
    document.getElementById('product-quantity').value = '1';
    document.getElementById('product-price').value = '';
    
    // Fechar o modal
    document.getElementById('product-modal').classList.add('hidden');
}

// Função para editar produto
function editProduct(index) {
    const product = appState.currentSaleProducts[index];
    
    // Preencher o modal com os dados do produto
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-quantity').value = product.quantity;
    document.getElementById('product-price').value = product.price;
    
    // Mostrar o modal
    document.getElementById('product-modal').classList.remove('hidden');
    
    // Alterar o comportamento do botão para editar
    const addBtn = document.getElementById('add-product-btn');
    addBtn.textContent = 'Atualizar Produto';
    addBtn.onclick = function() {
        updateProduct(index);
    };
}

// Função para atualizar produto
function updateProduct(index) {
    const name = document.getElementById('product-name').value.trim();
    const quantity = parseInt(document.getElementById('product-quantity').value);
    const price = parseFloat(document.getElementById('product-price').value);
    
    if (!name || isNaN(quantity) || quantity <= 0 || isNaN(price) || price <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    appState.currentSaleProducts[index] = {
        ...appState.currentSaleProducts[index],
        name: name,
        quantity: quantity,
        price: price
    };
    
    renderProductsList();
    
    // Limpar e resetar o modal
    document.getElementById('product-modal').classList.add('hidden');
    document.getElementById('product-name').value = '';
    document.getElementById('product-quantity').value = '1';
    document.getElementById('product-price').value = '';
    
    // Resetar o botão
    const addBtn = document.getElementById('add-product-btn');
    addBtn.textContent = 'Adicionar Produto';
    addBtn.onclick = addProduct;
}

// Função para deletar produto
function deleteProduct(index) {
    if (confirm('Tem certeza que deseja remover este produto?')) {
        appState.currentSaleProducts.splice(index, 1);
        renderProductsList();
    }
}

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
    if (!appState.currentUser) return;
    
    const userRef = db.collection('users').doc(appState.currentUser.uid);
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
            icon: 'https://example.com/icon.png' // URL do ícone
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

// Funções para mostrar/ocultar interfaces
function showLogin() {
    document.getElementById('login-section').classList.remove('hidden');
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('main-nav').classList.add('hidden');
}

function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
}

// Função para registrar a venda no Firestore
async function registerSale() {
    const clientSelect = document.getElementById('client-select');
    const clientName = clientSelect.value;
    const notes = document.getElementById('sale-notes').value.trim();
    
    if (!clientName) {
        alert('Por favor, selecione um cliente.');
        return;
    }
    
    if (appState.currentSaleProducts.length === 0) {
        alert('Por favor, adicione pelo menos um produto.');
        return;
    }
    
    try {
        // Calcular o total
        const total = appState.currentSaleProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
        
        // Registrar a venda no Firestore
        const docRef = await db.collection('sales').add({
            clientName: clientName,
            products: appState.currentSaleProducts,
            totalAmount: total,
            notes: notes,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userId: appState.currentUser ? appState.currentUser.uid : 'demo-user'
        });
        
        console.log("Venda registrada com ID: ", docRef.id);
        alert(`Venda para ${clientName} no valor de ${formatCurrency(total)} registrada com sucesso!`);
        
        // Limpar o formulário
        appState.currentSaleProducts = [];
        renderProductsList();
        document.getElementById('sale-notes').value = '';
        clientSelect.value = '';
        
    } catch (error) {
        console.error("Erro ao registrar venda: ", error);
        alert("Erro ao registrar venda. Tente novamente.");
    }
}

// Simular notificações para demonstração
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
            icon: 'https://example.com/icon.png'
        });
    }
}

// Event Listeners
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

document.getElementById('login-btn').addEventListener('click', function() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    
    // Solicitar permissão para notificações após o login
    requestNotificationPermission();
    
    renderView('home');
    alert('Login realizado com sucesso! (Modo demonstração)');
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

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const view = this.getAttribute('data-view');
        renderView(view);
    });
});

// Event Listeners para produtos
document.getElementById('add-product-button').addEventListener('click', function() {
    // Resetar o modal
    document.getElementById('product-name').value = '';
    document.getElementById('product-quantity').value = '1';
    document.getElementById('product-price').value = '';
    
    // Configurar o botão para adicionar
    const addBtn = document.getElementById('add-product-btn');
    addBtn.textContent = 'Adicionar Produto';
    addBtn.onclick = addProduct;
    
    // Mostrar o modal
    document.getElementById('product-modal').classList.remove('hidden');
});

document.getElementById('add-product-btn').addEventListener('click', addProduct);

// Fechar modais quando clicar no X
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        const modalId = this.getAttribute('data-modal');
        document.getElementById(modalId).classList.add('hidden');
    });
});

// Fechar modais quando clicar fora deles
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.add('hidden');
    }
});

// Registrar venda
document.getElementById('register-sale-btn').addEventListener('click', registerSale);

// Inicialização
showLogin();

// Verificar se o usuário já está logado (para demonstração)
auth.onAuthStateChanged((user) => {
    if (user) {
        appState.currentUser = user;
        showDashboard();
        renderView('home');
    } else {
        showLogin();
    }
});

// Simular notificação a cada 30 segundos para demonstração
setInterval(simulateNotification, 30000);
