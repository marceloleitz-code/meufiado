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

// Estado para produtos da compra atual
let currentSaleProducts = [];

// Função para formatar moeda
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

// Função para atualizar o resumo da venda
function updateSaleSummary() {
    const totalItems = currentSaleProducts.reduce((sum, product) => sum + product.quantity, 0);
    const totalValue = currentSaleProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
    document.getElementById('total-items').textContent = totalItems;
    document.getElementById('total-value').textContent = formatCurrency(totalValue);
}

// Função para renderizar a lista de produtos
function renderProductsList() {
    const container = document.getElementById('products-list');
    
    if (currentSaleProducts.length === 0) {
        container.innerHTML = `
            <div class="help-text">
                <i class="fas fa-shopping-cart"></i>
                <p>Nenhum produto adicionado ainda.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    currentSaleProducts.forEach((product, index) => {
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
    
    currentSaleProducts.push(product);
    renderProductsList();
    updateSaleSummary();
    
    // Limpar o formulário
    document.getElementById('product-name').value = '';
    document.getElementById('product-quantity').value = '1';
    document.getElementById('product-price').value = '';
    
    // Fechar o modal
    document.getElementById('product-modal').classList.add('hidden');
}

// Função para editar produto
function editProduct(index) {
    const product = currentSaleProducts[index];
    
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
    
    currentSaleProducts[index] = {
        ...currentSaleProducts[index],
        name: name,
        quantity: quantity,
        price: price
    };
    
    renderProductsList();
    updateSaleSummary();
    
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
        currentSaleProducts.splice(index, 1);
        renderProductsList();
        updateSaleSummary();
    }
}

// Função para mostrar detalhes da venda
function showSaleDetails(sale) {
    const modalContent = document.getElementById('sale-details-content');
    
    try {
        const products = typeof sale.products === 'string' ? JSON.parse(sale.products) : sale.products;
        const total = products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
        
        modalContent.innerHTML = `
            <div class="sale-details">
                <div class="detail-item">
                    <div class="detail-label">Cliente</div>
                    <div class="detail-value">${sale.client_name || 'N/A'}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Data</div>
                    <div class="detail-value">${new Date(sale.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                
                <div class="detail-item">
                    <div class="detail-label">Observações</div>
                    <div class="detail-value">${sale.notes || 'Nenhuma'}</div>
                </div>
                
                <h3>Produtos</h3>
                <table class="products-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Qtd</th>
                            <th>Preço Unit.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(product => `
                            <tr>
                                <td>${product.name}</td>
                                <td>${product.quantity}</td>
                                <td>${formatCurrency(product.price)}</td>
                                <td class="text-right">${formatCurrency(product.price * product.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3" style="text-align: right; font-weight: bold;">Total:</td>
                            <td class="text-right" style="font-weight: bold;">${formatCurrency(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        `;
    } catch (error) {
        modalContent.innerHTML = `
            <div class="help-text">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erro ao carregar detalhes da venda.</p>
            </div>
        `;
    }
    
    document.getElementById('sale-details-modal').classList.remove('hidden');
}

// Event Listeners para os novos elementos
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

// Modificar a função de registrar venda
document.getElementById('register-sale-btn').addEventListener('click', async function() {
    const clientSelect = document.getElementById('client-select');
    const clientId = clientSelect.value;
    const notes = document.getElementById('sale-notes').value.trim();
    
    if (!clientId) {
        alert('Por favor, selecione um cliente.');
        return;
    }
    
    if (currentSaleProducts.length === 0) {
        alert('Por favor, adicione pelo menos um produto.');
        return;
    }
    
    try {
        showLoading('Registrando venda...');
        
        // Calcular o total
        const total = currentSaleProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
        
        // Registrar a venda no Supabase
        const { data, error } = await supabase
            .from('sales')
            .insert([
                {
                    client_id: clientId,
                    products: currentSaleProducts,
                    total_amount: total,
                    notes: notes,
                    user_id: appState.currentUser.id
                }
            ])
            .select();
        
        if (error) throw error;
        
        // Registrar também como transação
        const { error: transactionError } = await supabase
            .from('transactions')
            .insert([
                {
                    user_id: clientId,
                    amount: total,
                    type: 'debit',
                    description: `Compra - ${currentSaleProducts.length} itens`,
                    sale_id: data[0].id
                }
            ]);
        
        if (transactionError) throw transactionError;
        
        alert('Venda registrada com sucesso!');
        
        // Limpar o formulário
        currentSaleProducts = [];
        renderProductsList();
        updateSaleSummary();
        document.getElementById('sale-notes').value = '';
        clientSelect.value = '';
        
        // Recarregar os dados
        if (appState.userType === 'merchant') {
            loadMerchantData();
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        handleSupabaseError(error, 'registro de venda');
    }
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
