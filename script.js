const API_URL = 'http://localhost:3000';

// Fonction pour afficher des messages
function showMessage(message, type = 'info') {
    // Supprimer les anciens messages
    const oldMessage = document.querySelector('.form-message');
    if (oldMessage) oldMessage.remove();
    
    // Créer le nouveau message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message form-message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    // Ajouter au formulaire
    const form = document.querySelector('.auth-form');
    if (form) {
        form.prepend(messageDiv);
    }
    
    // Supprimer après 5 secondes
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

// Vérifier si l'utilisateur est déjà connecté
function checkLoggedIn() {
    const user = localStorage.getItem('currentUser');
    if (user && window.location.pathname.includes('login.html')) {
        window.location.href = 'home.html';
    }
}

// Gestion du formulaire d'inscription
function setupRegisterForm() {
    const form = document.querySelector('.auth-form');
    if (!form) return;
    
    // Boutons Google/Apple (simulation)
    const googleBtn = document.querySelector('.btn-google');
    const appleBtn = document.querySelector('.btn-apple');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            showMessage('Connexion avec Google - Fonctionnalité en développement', 'info');
        });
    }
    
    if (appleBtn) {
        appleBtn.addEventListener('click', function() {
            showMessage('Connexion avec Apple - Fonctionnalité en développement', 'info');
        });
    }
    
    // Soumission du formulaire
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const fullname = document.getElementById('fullname').value;
        const email = document.getElementById('email').value;
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        // Validation basique
        if (!fullname || !email || !username || !password) {
            showMessage('Tous les champs sont requis', 'error');
            return;
        }
        
        if (password.length < 6) {
            showMessage('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }
        
        try {
            // Vérifier si l'email existe déjà
            const usersResponse = await fetch(`${API_URL}/users`);
            const users = await usersResponse.json();
            
            const emailExists = users.some(user => user.email === email);
            if (emailExists) {
                showMessage('Cet email est déjà utilisé', 'error');
                return;
            }
            
            // Créer l'utilisateur
            const newUser = {
                fullname,
                email,
                username,
                password,
                avatar: './images/image rachel.jpg',
                createdAt: new Date().toISOString()
            };
            
            const response = await fetch(`${API_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newUser)
            });
            
            if (!response.ok) throw new Error('Erreur lors de l\'inscription');
            
            const createdUser = await response.json();
            
            // Stocker l'utilisateur (sans le mot de passe)
            const userToStore = {
                id: createdUser.id,
                fullname: createdUser.fullname,
                email: createdUser.email,
                username: createdUser.username,
                avatar: createdUser.avatar
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userToStore));
            
            showMessage('Inscription réussie ! Redirection...', 'success');
            
            // Redirection vers la page d'accueil
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
            
        } catch (error) {
            showMessage('Erreur: ' + error.message, 'error');
        }
    });
}

// Gestion du formulaire de connexion
function setupLoginForm() {
    const form = document.querySelector('.auth-form');
    if (!form) return;
    
    // Boutons Google/Apple (simulation)
    const googleBtn = document.querySelector('.btn-google');
    const appleBtn = document.querySelector('.btn-apple');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', function() {
            // Simulation de connexion Google
            const googleUser = {
                id: 'google_' + Date.now(),
                fullname: 'Utilisateur Google',
                email: 'google@example.com',
                username: 'google_user',
                avatar: './images/default-avatar.jpg',
                provider: 'google'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(googleUser));
            showMessage('Connexion Google réussie ! Redirection...', 'success');
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        });
    }
    
    if (appleBtn) {
        appleBtn.addEventListener('click', function() {
            // Simulation de connexion Apple
            const appleUser = {
                id: 'apple_' + Date.now(),
                fullname: 'Utilisateur Apple',
                email: 'apple@example.com',
                username: 'apple_user',
                avatar: './images/default-avatar.jpg',
                provider: 'apple'
            };
            
            localStorage.setItem('currentUser', JSON.stringify(appleUser));
            showMessage('Connexion Apple réussie ! Redirection...', 'success');
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1000);
        });
    }
    
    // Soumission du formulaire
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            showMessage('Email et mot de passe requis', 'error');
            return;
        }
        
        try {
            // Récupérer tous les utilisateurs
            const response = await fetch(`${API_URL}/users`);
            if (!response.ok) throw new Error('Erreur serveur');
            
            const users = await response.json();
            
            // Chercher l'utilisateur
            const user = users.find(u => u.email === email && u.password === password);
            
            if (!user) {
                showMessage('Email ou mot de passe incorrect', 'error');
                return;
            }
            
            // Stocker l'utilisateur (sans le mot de passe)
            const userToStore = {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                username: user.username,
                avatar: user.avatar
            };
            
            localStorage.setItem('currentUser', JSON.stringify(userToStore));
            
            showMessage('Connexion réussie ! Redirection...', 'success');
            
            // Redirection vers la page d'accueil
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
            
        } catch (error) {
            showMessage('Erreur: ' + error.message, 'error');
        }
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script.js chargé');
    
    // Vérifier si l'utilisateur est déjà connecté
    checkLoggedIn();
    
    // Déterminer quelle page on est et initialiser le formulaire approprié
    if (window.location.pathname.includes('register.html')) {
        setupRegisterForm();
    } else if (window.location.pathname.includes('login.html')) {
        setupLoginForm();
    }
});