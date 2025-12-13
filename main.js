// VÉRIFICATION AUTHENTIFICATION
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupMobileMenu();
    updateUIFromLocalStorage();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Définir les pages
    const protectedPages = ['', 'index.html', 'explorer.html', 'notifications.html', 'profil.html'];
    const authPages = ['login.html', 'register.html', 'forgot-password.html'];
    
    // Vérifier si nous sommes sur une page protégée ou d'auth
    const isProtectedPage = protectedPages.includes(currentPage);
    const isAuthPage = authPages.includes(currentPage);
    const isHomePage = currentPage === '' || currentPage === 'index.html';
    
    // Règles de redirection
    if (!user) {
        // Non connecté : rediriger des pages protégées vers login
        if (isProtectedPage) {
            window.location.href = '/login.html';
            return;
        }
    } else {
        // Connecté : rediriger des pages d'auth vers l'accueil
        if (isAuthPage) {
            window.location.href = '/';
            return;
        }
        
        // Mettre à jour l'interface
        updateUIForLoggedInUser(user);
    }
}

// MISE À JOUR DE L'INTERFACE
function updateUIFromLocalStorage() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) {
        updateUIForLoggedInUser(user);
    }
}


function updateUIForLoggedInUser(user) {
    // Mettre à jour le profil dans la sidebar
    const profileNameElements = document.querySelectorAll('.profile-mini-name');
    const profileHandleElements = document.querySelectorAll('.profile-mini-handle');
    
    profileNameElements.forEach(el => {
        el.textContent = user.fullname || user.username;
    });
    
    profileHandleElements.forEach(el => {
        el.textContent = `@${user.username}`;
    });
    
    // Mettre à jour la navigation
    updateNavigationForLoggedInUser(user);
}

function updateNavigationForLoggedInUser(user) {
    // Navigation principale
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.innerHTML = `
            <div class="user-nav">
                <span class="user-welcome">Bonjour, <strong>${user.username}</strong></span>
                <button class="btn btn-secondary" id="logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    Déconnexion
                </button>
            </div>
        `;
        
        // Ajouter l'événement de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', logout);
        }
    }
    
    // Menu mobile
    const mobileNavActions = document.querySelector('.mobile-modal-actions');
    if (mobileNavActions) {
        mobileNavActions.innerHTML = `
            <div class="mobile-user-info">
                <span class="mobile-user-name">@${user.username}</span>
                <button class="btn btn-secondary" id="mobile-logout-btn">
                    <i class="fas fa-sign-out-alt"></i>
                    Déconnexion
                </button>
            </div>
        `;
        
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', logout);
        }
    }
}

// DÉCONNEXION
function logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/login.html';
    }
}

// MENU MOBILE
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileModal = document.querySelector('.mobile-modal');
    const mobileModalClose = document.querySelector('.mobile-modal-close');
    
    if (!hamburger || !mobileModal) return;
    
    // Ouvrir le menu
    hamburger.addEventListener('click', () => {
        mobileModal.classList.add('active');
        updateMobileMenuForAuth();
    });
    
    // Fermer le menu
    if (mobileModalClose) {
        mobileModalClose.addEventListener('click', () => {
            mobileModal.classList.remove('active');
        });
    }
    
    // Fermer en cliquant à l'extérieur
    mobileModal.addEventListener('click', (e) => {
        if (e.target === mobileModal) {
            mobileModal.classList.remove('active');
        }
    });
    
    // Empêcher la fermeture en cliquant à l'intérieur
    const modalContent = document.querySelector('.mobile-modal-content');
    if (modalContent) {
        modalContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
}

function updateMobileMenuForAuth() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const mobileModalNav = document.querySelector('.mobile-modal-nav');
    
    if (!mobileModalNav) return;
    
    if (user) {
        // Si connecté : afficher les liens normaux + bouton déconnexion
        const authLinks = mobileModalNav.querySelectorAll('a[href*="login"], a[href*="register"]');
        authLinks.forEach(link => link.style.display = 'none');
    } else {
        // Si non connecté : cacher le bouton déconnexion s'il existe
        const logoutBtn = mobileModalNav.querySelector('#mobile-logout-btn');
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// FONCTIONS UTILITAIRES
function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.style.display = 'block';
        element.style.color = '#f4212e';
        element.style.fontSize = '0.9rem';
        element.style.marginTop = '0.5rem';
    }
}

function hideError(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

function showLoading(button) {
    if (!button) return;
    
    const originalHTML = button.innerHTML;
    button.setAttribute('data-original-html', originalHTML);
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
    button.disabled = true;
}

function hideLoading(button) {
    if (!button) return;
    
    const originalHTML = button.getAttribute('data-original-html');
    if (originalHTML) {
        button.innerHTML = originalHTML;
    }
    button.disabled = false;
}

// GESTION DES LIENS ACTIFS
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const currentPage = currentPath.split('/').pop() || 'index.html';
    
    // Navigation principale
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Sidebar
    document.querySelectorAll('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// INITIALISATION
document.addEventListener('DOMContentLoaded', function() {
    // Définir le lien actif
    setActiveNavLink();
    
    // Mettre à jour l'état de connexion
    updateUIFromLocalStorage();
    
    // Gérer le bouton poster
    const postButton = document.querySelector('.sidebar-post-btn, .btn-primary');
    if (postButton) {
        postButton.addEventListener('click', function() {
            const user = JSON.parse(localStorage.getItem('user') || 'null');
            if (!user) {
                alert('Veuillez vous connecter pour poster un message');
                window.location.href = '/login.html';
                return;
            }
            // Logique de post ici
            console.log('Poster un message...');
        });
    }
});

// EXPORT POUR SCRIPT.JS
window.authModule = {
    showError,
    hideError,
    showLoading,
    hideLoading,
    logout,
    updateUIForLoggedInUser
};