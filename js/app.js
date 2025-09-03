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
        id: Date.now(),
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

// Funções para controlar modais
function openModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Funções para gerenciar a interface do usuário
function renderView(viewName) {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    
    if (viewName === 'notifications') {
        document.getElementById('notifications-view').classList.remove('hidden');
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

// Inicialização
function initializeApp() {
    // Garantir que todos os modais começam ocultos
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    
    // Fechar modais quando clicar no X
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            closeModal(modalId);
        });
    });
    
    // Fechar modais quando clicar fora deles
    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.classList.add('hidden');
        }
    });
    
    showLogin();
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
    openModal('product-modal');
});

document.getElementById('add-product-btn').addEventListener('click', addProduct);

// Registrar venda
document.getElementById('register-sale-btn').addEventListener('click', function() {
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
    
    // Calcular o total
    const total = appState.currentSaleProducts.reduce((sum, product) => sum + (product.price * product.quantity), 0);
    
    // Simular registro da venda
    alert(`Venda para ${clientName} registrada com sucesso!\nTotal: ${formatCurrency(total)}`);
    
    // Limpar o formulário
    appState.currentSaleProducts = [];
    renderProductsList();
    document.getElementById('sale-notes').value = '';
    clientSelect.value = '';
});

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', initializeApp);
