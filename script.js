
// VARIABLES & UTILITAIRES

// Charger la liste d'utilisateurs depuis localStorage
let usersList = JSON.parse(localStorage.getItem('app_users')) || [];

// Vérifier si l'utilisateur est déjà connecté
const loggedUser = JSON.parse(localStorage.getItem('user'));

// FONCTIONS GÉNÉRALES

// Afficher un message flash
function showMessage(message, type = 'info') {
    document.querySelectorAll('.flash-message').forEach(msg => msg.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = `flash-message flash-${type}`;
    messageDiv.textContent = message;

    const forms = document.querySelectorAll('form.auth-form, #forgot-password-form');
    if (forms.length > 0) {
        forms[0].insertBefore(messageDiv, forms[0].firstChild);
    } else {
        const container = document.querySelector('.auth-card') || document.body;
        container.insertBefore(messageDiv, container.firstChild);
    }

    setTimeout(() => {
        if (messageDiv.parentNode) messageDiv.parentNode.removeChild(messageDiv);
    }, 5000);
}

// Réactiver un bouton après erreur
function resetButton(button, originalText) {
    if (button) {
        button.disabled = false;
        button.textContent = originalText;
    }
}

// Générer un token aléatoire
function generateToken() {
    return 'token_' + Math.random().toString(36).substr(2) + '_' + Date.now().toString(36);
}

// Valider un email simple
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// GESTION UTILISATEURS

// Sauvegarder les utilisateurs
function saveUsers() {
    localStorage.setItem('app_users', JSON.stringify(usersList));
}

// Ajouter un utilisateur
function addUser(fullname, email, username, password) {
    const newUser = {
        id: Date.now().toString(),
        fullname: fullname.trim(),
        email: email.trim().toLowerCase(),
        username: username.trim(),
        password: password.trim(),
        createdAt: new Date().toISOString(),
        avatar: './images/image rachel.jpg',
        followers: 0,
        following: 0,
        posts: 0
    };
    usersList.push(newUser);
    saveUsers();
    return newUser;
}

// Vérifier si email existe
function emailExists(email) {
    return usersList.some(u => u.email.toLowerCase() === email.toLowerCase());
}

// Vérifier si username existe
function usernameExists(username) {
    return usersList.some(u => u.username.toLowerCase() === username.toLowerCase());
}

// Trouver utilisateur
function findUser(email, password) {
    return usersList.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password === password
    );
}

// REDIRECTION SI DÉJÀ CONNECTÉ
if (loggedUser) {
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath.includes('login.html') || 
                       currentPath.includes('register.html') || 
                       currentPath.includes('forgot-password.html');
    
    if (isAuthPage) {
        // REDIRECTION CORRECTE POUR NETLIFY
        window.location.href = '/';
    }
}

// INSCRIPTION
if (window.location.pathname.includes('register.html')) {
    const registerForm = document.querySelector('form.auth-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const fullname = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            // VALIDATION
            if (!fullname || !email || !username || !password) {
                showMessage('Veuillez remplir tous les champs', 'error');
                return;
            }
            
            if (!isValidEmail(email)) {
                showMessage('Email invalide', 'error');
                return;
            }
            
            if (password.length < 6) {
                showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
                return;
            }
            
            if (emailExists(email)) {
                showMessage('Cet email est déjà utilisé', 'error');
                return;
            }
            
            if (usernameExists(username)) {
                showMessage('Ce nom d\'utilisateur est déjà pris', 'error');
                return;
            }

            // Ajouter l'utilisateur
            submitBtn.disabled = true;
            submitBtn.textContent = 'Inscription en cours...';
            
            const newUser = addUser(fullname, email, username, password);

            // Connecter l'utilisateur
            localStorage.setItem('user', JSON.stringify(newUser));
            localStorage.setItem('token', generateToken());

            showMessage('Inscription réussie ! Redirection...', 'success');
            
            setTimeout(() => {
                // REDIRECTION CORRECTE POUR NETLIFY
                window.location.href = '/';
            }, 1000);
        });
    }
}

// CONNEXION
if (window.location.pathname.includes('login.html')) {
    const loginForm = document.querySelector('form.auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Connexion en cours...';

            if (!email || !password) {
                showMessage('Veuillez remplir tous les champs', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Email invalide', 'error');
                resetButton(submitBtn, originalText);
                return;
            }

            const user = findUser(email, password);
            if (user) {
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', generateToken());

                showMessage('Connexion réussie ! Redirection...', 'success');
                
                setTimeout(() => {
                    // REDIRECTION CORRECTE POUR NETLIFY
                    window.location.href = '/';
                }, 1000);
            } else {
                showMessage('Email ou mot de passe incorrect', 'error');
                resetButton(submitBtn, originalText);
            }
        });
    }
}

// MOT DE PASSE OUBLIÉ
if (window.location.pathname.includes('forgot-password.html')) {
    const forgotForm = document.getElementById('forgot-password-form');
    if (forgotForm) {
        forgotForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const submitBtn = document.getElementById('reset-btn');

            if (!email) {
                showMessage('Veuillez entrer votre adresse email', 'error');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('Email invalide', 'error');
                return;
            }

            const exists = emailExists(email);
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

            setTimeout(() => {
                if (exists) {
                    document.getElementById('success-message').style.display = 'block';
                    forgotForm.style.display = 'none';
                } else {
                    showMessage('Aucun compte trouvé avec cet email', 'error');
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Réinitialiser le mot de passe';
                }
            }, 1500);
        });
    }
}

// DÉCONNEXION
document.addEventListener('click', function(e) {
    if (e.target.closest('#logout-btn') || e.target.closest('#mobile-logout-btn')) {
        e.preventDefault();
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Redirection vers login
        window.location.href = '/login.html';
    }
});

// DONNÉES DE TEST
function initializeTestData() {
    if (usersList.length === 0) {
        const testUser = {
            id: '1',
            fullname: 'Test User',
            email: 'test@test.com',
            username: 'testuser',
            password: 'test123',
            createdAt: new Date().toISOString(),
            avatar: './images/image rachel.jpg',
            followers: 0,
            following: 0,
            posts: 0
        };
        usersList.push(testUser);
        saveUsers();
        console.log('✅ Utilisateur test créé');
    }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', function() {
    initializeTestData();
    
    // Mettre à jour l'interface si connecté
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        updateUIForLoggedInUser(user);
    }
});

// Fonction pour mettre à jour l'interface
function updateUIForLoggedInUser(user) {
    // Mettre à jour la navigation
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.innerHTML = `
            <div class="user-info">
                <span style="color: #1da1f2; margin-right: 10px;">@${user.username}</span>
                <button class="btn btn-secondary" id="logout-btn">
                    Déconnexion
                </button>
            </div>
        `;
    }
    
    // Mettre à jour le profil sidebar
    const profileName = document.querySelector('.profile-mini-name');
    const profileHandle = document.querySelector('.profile-mini-handle');
    
    if (profileName) profileName.textContent = user.fullname;
    if (profileHandle) profileHandle.textContent = `@${user.username}`;
}