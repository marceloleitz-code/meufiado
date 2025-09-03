// Configuração do Supabase - SUBSTITUA com suas credenciais
const SUPABASE_URL = 'https://ejngsvsvdjtgofdcgumv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqbmdzdnN2ZGp0Z29mZGNndW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTk0MTUsImV4cCI6MjA3MjQzNTQxNX0.s3hsUn-V4pTSTC5sIu7YnHz3cAtm72bETDyNQW4aO3A';

// Inicializar o Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Estado global para o app
const appState = {
    notifications: [],
    userType: 'client',
    currentUser: null,
    customers: [],
    transactions: []
};

// Função para verificar e exibir erros do Supabase
function handleSupabaseError(error, context) {
    console.error(`Erro no ${context}:`, error);
    
    if (error.code === 'PGRST301') {
        alert('Erro de configuração. Verifique se as tabelas foram criadas corretamente.');
    } else if (error.code === 'PGRST116') {
        alert('Caminho inválido. Verifique a URL do Supabase.');
    } else {
        alert(`Erro: ${error.message}`);
    }
}

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
        loadClientData();
    } else {
        document.getElementById('merchant-view').classList.remove('hidden');
        loadMerchantData();
    }
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('data-view') === viewName) {
            item.classList.add('active');
        }
    });
}

// ... (o restante das funções permanecem iguais até as funções de autenticação)

// Funções de autenticação
async function signUp(email, password) {
    try {
        showLoading('Criando conta...');
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });
        
        if (error) {
            handleSupabaseError(error, 'cadastro');
            return null;
        }
        
        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        handleSupabaseError(error, 'cadastro');
        return null;
    }
}

async function signIn(email, password) {
    try {
        showLoading('Fazendo login...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });
        
        if (error) {
            handleSupabaseError(error, 'login');
            return null;
        }
        
        hideLoading();
        return data;
    } catch (error) {
        hideLoading();
        handleSupabaseError(error, 'login');
        return null;
    }
}

// Funções para carregar dados
// Testar conexão com Supabase
async function testConnection() {
    try {
        const { data, error } = await supabase.from('profiles').select('count');
        
        if (error) {
            console.log('Erro ao conectar com Supabase:', error);
            if (error.code === 'PGRST301') {
                console.log('Tabela não existe. Criando dados de demonstração...');
                createDemoData();
            }
        } else {
            console.log('Conexão com Supabase bem-sucedida!');
        }
    } catch (error) {
        console.log('Erro geral de conexão:', error);
        createDemoData(); // Usar dados locais em caso de erro
    }
}

// Executar teste de conexão após inicialização
setTimeout(testConnection, 1000);
async function loadClientData() {
    if (!appState.currentUser) return;
    
    try {
        showLoading('Carregando dados...');
        
        // Primeiro verifica se a tabela existe tentando contar os registros
        const { count, error: countError } = await supabase
            .from('transactions')
            .select('*', { count: 'exact', head: true });
            
        if (countError && countError.code === 'PGRST301') {
            // Tabela não existe, vamos criar dados de demonstração
            createDemoData();
            hideLoading();
            return;
        }
        
        // Carregar transações do cliente
        const { data: transactions, error } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', appState.currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) {
            if (error.code === 'PGRST301' || error.code === '42P01') {
                // Tabela não existe, criar dados de demonstração
                createDemoData();
            } else {
                handleSupabaseError(error, 'carregamento de transações');
            }
        } else {
            appState.transactions = transactions || [];
            renderClientTransactions();
            updateClientBalance();
        }
        
        hideLoading();
    } catch (error) {
        hideLoading();
        handleSupabaseError(error, 'carregamento de dados do cliente');
    }
}

// Função para criar dados de demonstração (usada se as tabelas não existirem)
function createDemoData() {
    console.log('Criando dados de demonstração...');
    
    // Dados de exemplo
    appState.transactions = [
        {
            id: '1',
            amount: 45.90,
            type: 'debit',
            description: 'Compra no mercadinho',
            created_at: new Date('2023-05-20T14:32:00').toISOString()
        },
        {
            id: '2',
            amount: 100.00,
            type: 'credit',
            description: 'Pagamento realizado',
            created_at: new Date('2023-05-15T09:15:00').toISOString()
        }
    ];
    
    appState.customers = [
        {
            id: '1',
            email: 'maria.silva@email.com',
            name: 'Maria Silva',
            is_client: true
        },
        {
            id: '2',
            email: 'joao.santos@email.com',
            name: 'João Santos',
            is_client: true
        }
    ];
    
    renderClientTransactions();
    updateClientBalance();
    renderCustomers();
    updateMerchantBalance();
    
    // Preencher select de clientes
    const clientSelect = document.getElementById('client-select');
    clientSelect.innerHTML = '<option value="" disabled selected>Selecione o cliente</option>';
    
    appState.customers.forEach(customer => {
        const option = document.createElement('option');
        option.value = customer.id;
        option.textContent = customer.name || customer.email;
        clientSelect.appendChild(option);
    });
}

// Funções para mostrar/ocultar loading
function showLoading(message = 'Carregando...') {
    // Criar ou mostrar elemento de loading
    let loadingEl = document.getElementById('loading');
    if (!loadingEl) {
        loadingEl = document.createElement('div');
        loadingEl.id = 'loading';
        loadingEl.className = 'loading';
        loadingEl.innerHTML = `
            <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="loading-message">${message}</div>
        `;
        document.body.appendChild(loadingEl);
    } else {
        loadingEl.querySelector('.loading-message').textContent = message;
        loadingEl.classList.remove('hidden');
    }
}

function hideLoading() {
    const loadingEl = document.getElementById('loading');
    if (loadingEl) {
        loadingEl.classList.add('hidden');
    }
}

// ... (o restante do código permanece similar, mas com tratamento de erro adicionado)

// Inicialização
showLogin();

// Verificar se o usuário já está logado
supabase.auth.getSession().then(({ data: { session } }) => {
    if (session && session.user) {
        appState.currentUser = session.user;
        showDashboard();
        renderView('home');
    }
}).catch(error => {
    console.error('Erro ao verificar sessão:', error);
});

// Ouvir mudanças de autenticação
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session && session.user) {
        appState.currentUser = session.user;
        showDashboard();
        renderView('home');
    } else if (event === 'SIGNED_OUT') {
        appState.currentUser = null;
        showLogin();
    }
});
