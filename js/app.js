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

// Função para alternar entre abas
function switchTab(tabElement) {
    // Encontrar o container de abas
    const tabsContainer = tabElement.closest('.tabs');
    const tabContent = tabsContainer.nextElementSibling;
    
    // Remover classe active de todas as abas
    tabsContainer.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Adicionar classe active à aba clicada
    tabElement.classList.add('active');
    
    // Obter o ID da aba a ser mostrada
    const tabName = tabElement.getAttribute('data-tab');
    
    // Ocultar todo o conteúdo de abas
    tabContent.querySelectorAll('[id$="-tab"]').forEach(tabContentElement => {
        tabContentElement.classList.add('hidden');
    });
    
    // Mostrar a aba selecionada
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }
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
// Estado global para produtos
appState.products = [];

// Função para carregar produtos do Firebase
async function loadProducts() {
    try {
        const { data: products, error } = await supabase
            .from('products')
            .select('*')
            .order('name');
        
        if (error) throw error;
        
        appState.products = products || [];
        renderProductsManagementList();
        renderQuickProducts();
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        // Dados de exemplo para demonstração
        appState.products = [
            { id: 1, name: "Arroz", price: 25.90, category: "Alimentos" },
            { id: 2, name: "Feijão", price: 8.50, category: "Alimentos" },
            { id: 3, name: "Óleo", price: 7.20, category: "Alimentos" },
            { id: 4, name: "Açúcar", price: 4.80, category: "Alimentos" },
            { id: 5, name: "Café", price: 12.90, category: "Alimentos" }
        ];
        renderProductsManagementList();
        renderQuickProducts();
    }
}

// Função para renderizar a lista de gestão de produtos
function renderProductsManagementList() {
    const container = document.getElementById('products-management-list');
    
    if (appState.products.length === 0) {
        container.innerHTML = `
            <div class="help-text">
                <i class="fas fa-box"></i>
                <p>Nenhum produto cadastrado ainda.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    appState.products.forEach(product => {
        const productElement = document.createElement('div');
        productElement.className = 'product-management-item';
        productElement.innerHTML = `
            <div class="product-management-info">
                <div class="product-management-name">${product.name}</div>
                <div class="product-management-price">${formatCurrency(product.price)}</div>
                ${product.category ? `<div class="product-management-category">Categoria: ${product.category}</div>` : ''}
            </div>
            <div class="product-management-actions">
                <button class="product-management-btn btn-edit" data-id="${product.id}">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="product-management-btn btn-delete" data-id="${product.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        container.appendChild(productElement);
    });
    
    // Adicionar event listeners para os botões
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-id');
            editProductFromList(productId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-id');
            deleteProductFromList(productId);
        });
    });
}

// Função para renderizar produtos rápidos na venda
function renderQuickProducts() {
    const quickProductsContainer = document.getElementById('quick-products');
    if (!quickProductsContainer) return;
    
    if (appState.products.length === 0) {
        quickProductsContainer.innerHTML = '';
        return;
    }
    
    quickProductsContainer.innerHTML = `
        <div class="quick-products-title">Produtos Rápidos:</div>
        <div class="quick-products-grid">
            ${appState.products.map(product => `
                <div class="quick-product-item" data-id="${product.id}">
                    <div class="quick-product-name">${product.name}</div>
                    <div class="quick-product-price">${formatCurrency(product.price)}</div>
                </div>
            `).join('')}
        </div>
    `;
    
    // Adicionar event listeners para os produtos rápidos
    document.querySelectorAll('.quick-product-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const productId = e.currentTarget.getAttribute('data-id');
            addQuickProductToSale(productId);
        });
    });
}

// Função para adicionar produto rápido à venda
function addQuickProductToSale(productId) {
    const product = appState.products.find(p => p.id == productId);
    if (!product) return;
    
    // Preencher automaticamente o modal de adicionar produto
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-quantity').value = 1;
    
    // Focar no botão de adicionar
    setTimeout(() => {
        document.getElementById('add-product-btn').focus();
    }, 100);
}

// Função para adicionar novo produto à lista
async function addNewProductToDatabase(productData) {
    try {
        const { data, error } = await supabase
            .from('products')
            .insert([productData])
            .select();
        
        if (error) throw error;
        
        // Recarregar a lista de produtos
        await loadProducts();
        return data[0];
    } catch (error) {
        console.error('Erro ao adicionar produto:', error);
        // Para demonstração, adicionar localmente
        const newProduct = {
            id: Date.now(),
            ...productData
        };
        appState.products.push(newProduct);
        renderProductsManagementList();
        renderQuickProducts();
        return newProduct;
    }
}

// Função para editar produto da lista
async function editProductFromList(productId) {
    const product = appState.products.find(p => p.id == productId);
    if (!product) return;
    
    // Preencher o modal de gestão com os dados do produto
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name-management').value = product.name;
    document.getElementById('product-price-management').value = product.price;
    document.getElementById('product-category').value = product.category || '';
    
    // Mostrar o modal de gestão
    openModal('product-management-modal');
}

// Função para excluir produto da lista
async function deleteProductFromList(productId) {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    
    try {
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
        
        if (error) throw error;
        
        // Recarregar a lista de produtos
        await loadProducts();
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        // Para demonstração, remover localmente
        appState.products = appState.products.filter(p => p.id != productId);
        renderProductsManagementList();
        renderQuickProducts();
    }
}

// Função para salvar produto (novo ou editado)
async function saveProduct() {
    const productId = document.getElementById('product-id').value;
    const name = document.getElementById('product-name-management').value.trim();
    const price = parseFloat(document.getElementById('product-price-management').value);
    const category = document.getElementById('product-category').value.trim();
    
    if (!name || isNaN(price) || price <= 0) {
        alert('Por favor, preencha todos os campos corretamente.');
        return;
    }
    
    const productData = {
        name,
        price,
        category: category || null,
        updated_at: new Date().toISOString()
    };
    
    try {
        if (productId) {
            // Editar produto existente
            const { error } = await supabase
                .from('products')
                .update(productData)
                .eq('id', productId);
            
            if (error) throw error;
        } else {
            // Adicionar novo produto
            productData.created_at = new Date().toISOString();
            const { error } = await supabase
                .from('products')
                .insert([productData]);
            
            if (error) throw error;
        }
        
        // Recarregar a lista de produtos
        await loadProducts();
        closeModal('product-management-modal');
        alert('Produto salvo com sucesso!');
    } catch (error) {
        console.error('Erro ao salvar produto:', error);
        alert('Erro ao salvar produto. Tente novamente.');
    }
}

// Adicione estas inicializações no final do seu arquivo JavaScript

// No final da função initializeApp(), adicione:
document.getElementById('add-new-product-btn').addEventListener('click', function() {
    // Limpar o modal de gestão
    document.getElementById('product-id').value = '';
    document.getElementById('product-name-management').value = '';
    document.getElementById('product-price-management').value = '';
    document.getElementById('product-category').value = '';
    
    // Mostrar o modal de gestão
    openModal('product-management-modal');
});

// Adicionar event listener para salvar produto
document.getElementById('save-product-btn').addEventListener('click', saveProduct);

// Carregar produtos quando o dashboard for mostrado
// Modifique a função showDashboard():
function showDashboard() {
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    document.getElementById('main-nav').classList.remove('hidden');
    
    // Carregar produtos se for o merchant
    if (appState.userType === 'merchant') {
        loadProducts();
    }
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

// Adicionar event listener para as abas
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        switchTab(this);
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
