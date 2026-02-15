// login.js - Lógica de validação de login e redirecionamento
document.addEventListener('DOMContentLoaded', () => {
    
    // ... (Seleção de elementos e constantes CREDENCIAIS) ...
    const loginForm = document.getElementById('login-form');
    const tipoSelect = document.getElementById('tipo');
    const identificadorInput = document.getElementById('identificador');
    const senhaInput = document.getElementById('senha');
    const labelIdentificador = document.getElementById('label-identificador');
    const iconIdentificador = document.getElementById('icon-identificador');
    const errorMessage = document.getElementById('error-message');
    const btnLogin = document.getElementById('btn-login');

    // Credenciais de Teste
    const CREDENCIAIS = {
        Gestor: { id: 'admin', senha: '12345', label: 'Usuário', placeholder: 'Seu nome de usuário', icon: 'fa-user' },
        Professor: { id: '12345678900', senha: 'prof123', label: 'CPF', placeholder: 'Seu CPF (apenas números)', icon: 'fa-id-card' },
        Aluno: { id: '20240001', senha: 'aluno123', label: 'Matrícula', placeholder: 'Sua matrícula', icon: 'fa-graduation-cap' }
    };
    
    // ... (Função updateIdentifierField) ...
    function updateIdentifierField() {
        // ... (lógica para mudar label e ícone) ...
    }

    updateIdentifierField();
    tipoSelect.addEventListener('change', updateIdentifierField);

    // --- Lógica de Login ---

    loginForm.addEventListener('submit', function(e) {
        e.preventDefault(); 

        const tipo = tipoSelect.value;
        const identificador = identificadorInput.value.trim();
        const senha = senhaInput.value.trim();
        const credenciaisCorretas = CREDENCIAIS[tipo];

        errorMessage.classList.add('hidden');
        btnLogin.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Entrando...';
        btnLogin.disabled = true;

        setTimeout(() => {
            
            if (identificador === credenciaisCorretas.id && senha === credenciaisCorretas.senha) {
                // SUCESSO NO LOGIN
                
                localStorage.setItem('isAuthenticated', 'true'); 
                localStorage.setItem('userType', tipo); 
                
                // **** REDIRECIONAMENTO ****
                if (tipo === 'Gestor') {
                    window.location.href = 'dashboard.html'; // Redireciona para o dashboard
                } else {
                    // Para Aluno e Professor, você pode definir uma página específica
                    // Por exemplo: window.location.href = 'painel_' + tipo.toLowerCase() + '.html';
                    
                    // Por enquanto, vamos para o dashboard também, mas o ideal seria ter páginas separadas
                    // Se você não tem páginas separadas para Aluno/Professor, use 'dashboard.html'
                    window.location.href = 'dashboard.html'; 
                }

            } else {
                // FALHA NO LOGIN
                errorMessage.classList.remove('hidden');
                senhaInput.value = '';
                identificadorInput.focus();
            }
            
            // Restaura o botão
            btnLogin.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
            btnLogin.disabled = false;
            
        }, 1500); 
    });


    // --- Verifica status de login na inicialização ---
    (function checkLoginStatus() {
        if (localStorage.getItem('isAuthenticated') === 'true') {
            window.location.href = 'dashboard.html';
        }
    })();
});