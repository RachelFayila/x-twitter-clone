class App {
  constructor() {
    this.currentUser = null;
    this.API_BASE_URL = 'http://localhost:3000';
    this.init();
  }

  init() {
    this.checkAuthentication();
    this.setupNavigation();
    this.setupMobileMenu();
    this.setupEventListeners();
  }

  // Vérifier si l'utilisateur est connecté
  checkAuthentication() {
    const userSession = this.getUserSession();
    
    if (userSession && userSession.token) {
      this.currentUser = userSession.user;
      this.updateUIForLoggedInUser();
    } else {
      this.updateUIForLoggedOutUser();
    }
  }

  // Gestion de la session utilisateur
  saveUserSession(userData) {
    if (userData && userData.token) {
      localStorage.setItem('userSession', JSON.stringify(userData));
      this.currentUser = userData.user;
      this.updateUIForLoggedInUser();
    }
  }

  getUserSession() {
    const session = localStorage.getItem('userSession');
    return session ? JSON.parse(session) : null;
  }

  logout() {
    localStorage.removeItem('userSession');
    this.currentUser = null;
    this.updateUIForLoggedOutUser();
    window.location.href = 'index.html';
  }

  // Mettre à jour l'interface pour un utilisateur connecté
  updateUIForLoggedInUser() {
    const userSession = this.getUserSession();
    if (!userSession) return;

    // Mettre à jour les liens de navigation
    const navActions = document.querySelector('.nav-actions');
    const sidebarProfile = document.querySelector('.sidebar-profile .profile-mini');
    
    if (navActions) {
      navActions.innerHTML = `
        <div class="user-menu">
          <button class="btn btn-secondary" id="logout-btn">Déconnexion</button>
          <a href="profil.html" class="btn btn-primary">Profil</a>
        </div>
      `;
      
      document.getElementById('logout-btn')?.addEventListener('click', () => this.logout());
    }

    if (sidebarProfile) {
      sidebarProfile.innerHTML = `
        <img src="${userSession.user.avatar || './images/image rachel.jpg'}" alt="Avatar" class="profile-mini-avatar">
        <div class="profile-mini-info">
          <span class="profile-mini-name">${userSession.user.fullname}</span>
          <span class="profile-mini-handle">@${userSession.user.username}</span>
        </div>
        <i class="fas fa-ellipsis-h"></i>
      `;
    }

    // Cacher les pages d'authentification si l'utilisateur est connecté
    if (window.location.pathname.includes('login.html') || 
        window.location.pathname.includes('register.html')) {
      window.location.href = 'index.html';
    }
  }

  // Mettre à jour l'interface pour un utilisateur non connecté
  updateUIForLoggedOutUser() {
    const navActions = document.querySelector('.nav-actions');
    
    if (navActions && !navActions.querySelector('.btn-secondary')) {
      navActions.innerHTML = `
        <a href="login.html" class="btn btn-secondary">Connexion</a>
        <a href="register.html" class="btn btn-primary">S'inscrire</a>
      `;
    }
  }

  // Configuration de la navigation
  setupNavigation() {
    // Marquer le lien actif dans la navigation
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.nav-link, .sidebar-link, .mobile-nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Gérer le bouton de retour
    const backBtn = document.querySelector('.back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.history.back();
      });
    }
  }

  // Configuration du menu mobile
  setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const mobileModal = document.querySelector('.mobile-modal');
    const mobileModalClose = document.querySelector('.mobile-modal-close');
    
    if (hamburger && mobileModal) {
      hamburger.addEventListener('click', () => {
        mobileModal.style.display = 'flex';
      });
    }
    
    if (mobileModalClose && mobileModal) {
      mobileModalClose.addEventListener('click', () => {
        mobileModal.style.display = 'none';
      });
    }
    
    // Fermer le modal en cliquant à l'extérieur
    if (mobileModal) {
      mobileModal.addEventListener('click', (e) => {
        if (e.target === mobileModal) {
          mobileModal.style.display = 'none';
        }
      });
    }
  }

  // Configuration des écouteurs d'événements globaux
  setupEventListeners() {
    // Gérer le bouton "Suivre"
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-follow') || 
          e.target.closest('.btn-follow')) {
        this.handleFollow(e);
      }
    });

    // Gérer les likes
    document.addEventListener('click', (e) => {
      if (e.target.closest('.post-action')) {
        const actionBtn = e.target.closest('.post-action');
        const heartIcon = actionBtn.querySelector('.fa-heart');
        
        if (heartIcon) {
          const isLiked = heartIcon.classList.contains('far');
          const countSpan = actionBtn.querySelector('span');
          
          if (countSpan) {
            let count = parseInt(countSpan.textContent);
            if (isLiked) {
              heartIcon.classList.remove('far');
              heartIcon.classList.add('fas');
              countSpan.textContent = count + 1;
            } else {
              heartIcon.classList.remove('fas');
              heartIcon.classList.add('far');
              countSpan.textContent = count - 1;
            }
          }
        }
      }
    });
  }

  // Gérer l'action "Suivre"
  handleFollow(event) {
    const followBtn = event.target.classList.contains('btn-follow') 
      ? event.target 
      : event.target.closest('.btn-follow');
    
    if (!followBtn) return;
    
    if (followBtn.textContent === 'Suivre') {
      followBtn.textContent = 'Suivi';
      followBtn.classList.add('following');
    } else {
      followBtn.textContent = 'Suivre';
      followBtn.classList.remove('following');
    }
  }

  // Méthode utilitaire pour les requêtes API
  async apiRequest(endpoint, options = {}) {
    const userSession = this.getUserSession();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (userSession && userSession.token) {
      headers['Authorization'] = `Bearer ${userSession.token}`;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, {
        ...options,
        headers
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la requête');
      }

      return data;
    } catch (error) {
      console.error('Erreur API:', error);
      throw error;
    }
  }
}

// Initialiser l'application quand le DOM est chargé
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});