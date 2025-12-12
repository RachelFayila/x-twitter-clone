// Configuration de l'API
const API_URL = 'http://localhost:3000/api';

// Vérifier l'authentification au chargement
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  setupMobileMenu();
});

// Fonction pour vérifier l'authentification
async function checkAuth() {
  const sessionId = localStorage.getItem('sessionId');
  const currentPage = window.location.pathname.split('/').pop();
  
  // Pages protégées
  const protectedPages = ['index.html', 'explorer.html', 'notification.html', 'profil.html'];
  const authPages = ['login.html', 'register.html', 'forgot-password.html'];
  
  if (!sessionId) {
    // Pas de session, rediriger vers login si on est sur une page protégée
    if (protectedPages.includes(currentPage)) {
      window.location.href = 'login.html';
    }
    return;
  }
  
  // Vérifier la session avec l'API
  try {
    const response = await fetch(`${API_URL}/validate-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId })
    });
    
    const data = await response.json();
    
    if (data.valid) {
      // Session valide
      if (authPages.includes(currentPage)) {
        // Si déjà connecté et sur une page d'auth, rediriger vers l'accueil
        window.location.href = 'index.html';
      }
      
      // Mettre à jour l'interface avec les infos utilisateur
      updateUIForLoggedInUser(data.user);
    } else {
      // Session invalide
      localStorage.removeItem('sessionId');
      localStorage.removeItem('user');
      
      if (protectedPages.includes(currentPage)) {
        window.location.href = 'login.html';
      }
    }
  } catch (error) {
    console.error('Erreur de vérification de session:', error);
    
    if (protectedPages.includes(currentPage)) {
      window.location.href = 'login.html';
    }
  }
}

// Mettre à jour l'interface pour un utilisateur connecté
function updateUIForLoggedInUser(user) {
  // Mettre à jour le nom dans la sidebar si l'élément existe
  const profileNameElements = document.querySelectorAll('.profile-mini-name, .profile-name');
  const profileHandleElements = document.querySelectorAll('.profile-mini-handle, .profile-handle');
  
  profileNameElements.forEach(element => {
    element.textContent = user.fullName || user.username;
  });
  
  profileHandleElements.forEach(element => {
    if (element.classList.contains('profile-handle')) {
      element.textContent = `@${user.username}`;
    } else if (element.classList.contains('profile-mini-handle')) {
      element.textContent = `@${user.username}`;
    }
  });
  
  // Mettre à jour les boutons de navigation
  const navActions = document.querySelector('.nav-actions');
  if (navActions) {
    navActions.innerHTML = `
      <button class="btn btn-secondary" id="logout-btn">Déconnexion</button>
    `;
    
    document.getElementById('logout-btn').addEventListener('click', logout);
  }
  
  // Mettre à jour les liens du menu mobile
  const mobileNavActions = document.querySelector('.mobile-modal-actions');
  if (mobileNavActions) {
    mobileNavActions.innerHTML = `
      <button class="btn btn-secondary" id="mobile-logout-btn">Déconnexion</button>
    `;
    
    document.getElementById('mobile-logout-btn').addEventListener('click', logout);
  }
}

// Fonction de déconnexion
async function logout() {
  const sessionId = localStorage.getItem('sessionId');
  
  if (sessionId) {
    try {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId })
      });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  }
  
  localStorage.removeItem('sessionId');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Gestion du menu mobile
function setupMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const mobileModal = document.querySelector('.mobile-modal');
  const mobileModalClose = document.querySelector('.mobile-modal-close');
  
  if (hamburger && mobileModal) {
    hamburger.addEventListener('click', () => {
      mobileModal.classList.add('active');
    });
    
    if (mobileModalClose) {
      mobileModalClose.addEventListener('click', () => {
        mobileModal.classList.remove('active');
      });
    }
    
    // Fermer en cliquant en dehors
    mobileModal.addEventListener('click', (e) => {
      if (e.target === mobileModal) {
        mobileModal.classList.remove('active');
      }
    });
  }
}

// Fonctions utilitaires
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
    element.style.display = 'block';
  }
}

function hideError(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}

function showLoading(button) {
  const btnText = button.querySelector('#btn-text');
  const btnLoading = button.querySelector('#btn-loading');
  
  if (btnText && btnLoading) {
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
  }
  
  button.disabled = true;
}

function hideLoading(button) {
  const btnText = button.querySelector('#btn-text');
  const btnLoading = button.querySelector('#btn-loading');
  
  if (btnText && btnLoading) {
    btnText.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
  
  button.disabled = false;
}

// Exporter les fonctions pour script.js
window.authModule = {
  API_URL,
  showError,
  hideError,
  showLoading,
  hideLoading
};