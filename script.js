// Gestion du formulaire de connexion
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Validation basique
    if (!email || !password) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    
    try {
      const response = await fetch(`${window.authModule.API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Connexion réussie
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';
      } else {
        // Erreur de connexion
        if (data.error === 'Utilisateur non trouvé') {
          alert('Aucun compte trouvé avec cet email. Voulez-vous créer un compte ?');
        } else if (data.error === 'Mot de passe incorrect') {
          alert('Mot de passe incorrect. Veuillez réessayer.');
        } else {
          alert('Erreur de connexion: ' + data.error);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion. Veuillez vérifier votre connexion internet.');
    }
  });
  
  // Lien "Mot de passe oublié"
  const forgotPasswordLink = document.querySelector('.forgot-password');
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'forgot-password.html';
    });
  }
}

// Gestion du formulaire d'inscription
const registerForm = document.querySelector('.auth-form');
if (registerForm && window.location.pathname.includes('register.html')) {
  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullname = document.getElementById('fullname').value;
    const username = document.getElementById('username').value;
    const birthdate = document.getElementById('birthdate').value;
    
    // Validation
    if (!email || !password || !fullname || !username || !birthdate) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (password.length < 8) {
      alert('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    
    // Calcul de l'âge
    const birthDate = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 13) {
      alert('Vous devez avoir au moins 13 ans pour créer un compte');
      return;
    }
    
    try {
      const response = await fetch(`${window.authModule.API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName: fullname,
          username,
          birthdate
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Inscription réussie
        localStorage.setItem('sessionId', data.sessionId);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.location.href = 'index.html';
      } else {
        // Erreur d'inscription
        alert('Erreur d\'inscription: ' + data.error);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur d\'inscription. Veuillez vérifier votre connexion internet.');
    }
  });
}

// Gestion du formulaire de mot de passe oublié
const forgotPasswordForm = document.getElementById('forgot-password-form');
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const resetBtn = document.getElementById('reset-btn');
    
    if (!email) {
      window.authModule.showError('email-error', 'Veuillez entrer votre adresse email');
      return;
    }
    
    // Validation d'email basique
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      window.authModule.showError('email-error', 'Veuillez entrer une adresse email valide');
      return;
    }
    
    window.authModule.hideError('email-error');
    window.authModule.showLoading(resetBtn);
    
    try {
      const response = await fetch(`${window.authModule.API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      window.authModule.hideLoading(resetBtn);
      
      if (response.ok) {
        // Afficher le message de succès
        forgotPasswordForm.style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
      } else {
        window.authModule.showError('email-error', data.error || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur:', error);
      window.authModule.hideLoading(resetBtn);
      window.authModule.showError('email-error', 'Erreur de connexion au serveur');
    }
  });
}

// Gestion des boutons de suivi
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('btn-follow') || 
      (e.target.parentElement && e.target.parentElement.classList.contains('btn-follow'))) {
    
    const button = e.target.classList.contains('btn-follow') ? e.target : e.target.parentElement;
    
    if (button.textContent === 'Suivre') {
      button.textContent = 'Suivi(e)';
      button.style.backgroundColor = '#333';
      button.style.color = '#fff';
    } else {
      button.textContent = 'Suivre';
      button.style.backgroundColor = '';
      button.style.color = '';
    }
  }
});

// Gestion des actions de posts (like, retweet, comment)
document.addEventListener('click', function(e) {
  // Gérer les likes
  if (e.target.closest('.post-action') && e.target.closest('.post-action').querySelector('.fa-heart')) {
    const actionBtn = e.target.closest('.post-action');
    const heartIcon = actionBtn.querySelector('.fa-heart');
    const countSpan = actionBtn.querySelector('span');
    
    if (heartIcon.classList.contains('far')) {
      // Ajouter like
      heartIcon.classList.remove('far');
      heartIcon.classList.add('fas');
      heartIcon.style.color = '#f4212e';
      countSpan.textContent = parseInt(countSpan.textContent) + 1;
    } else {
      // Retirer like
      heartIcon.classList.remove('fas');
      heartIcon.classList.add('far');
      heartIcon.style.color = '';
      countSpan.textContent = parseInt(countSpan.textContent) - 1;
    }
  }
  
  // Gérer les retweets
  if (e.target.closest('.post-action') && e.target.closest('.post-action').querySelector('.fa-retweet')) {
    const actionBtn = e.target.closest('.post-action');
    const retweetIcon = actionBtn.querySelector('.fa-retweet');
    const countSpan = actionBtn.querySelector('span');
    
    if (retweetIcon.style.color !== 'rgb(0, 186, 124)') {
      // Ajouter retweet
      retweetIcon.style.color = '#00ba7c';
      countSpan.textContent = parseInt(countSpan.textContent) + 1;
    } else {
      // Retirer retweet
      retweetIcon.style.color = '';
      countSpan.textContent = parseInt(countSpan.textContent) - 1;
    }
  }
});

// Gestion du bouton "Tout marquer comme lu" dans les notifications
const markAllReadBtn = document.getElementById('mark-all-read');
if (markAllReadBtn) {
  markAllReadBtn.addEventListener('click', function() {
    const unreadNotifications = document.querySelectorAll('.notification.unread');
    const notificationBadges = document.querySelectorAll('.notification-badge');
    
    unreadNotifications.forEach(notification => {
      notification.classList.remove('unread');
    });
    
    notificationBadges.forEach(badge => {
      badge.style.display = 'none';
    });
    
    alert('Toutes les notifications ont été marquées comme lues');
  });
}

// Gestion de la création de post
const postCreatorBtn = document.querySelector('.sidebar-post-btn');
if (postCreatorBtn) {
  postCreatorBtn.addEventListener('click', function() {
    const postTextarea = document.querySelector('.post-creator-input textarea');
    if (postTextarea) {
      postTextarea.focus();
    } else {
      alert('Fonctionnalité de création de post - À implémenter');
    }
  });
}

// Gestion de la recherche
const searchInputs = document.querySelectorAll('.search-container input, #main-search');
searchInputs.forEach(input => {
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.trim()) {
      alert(`Recherche pour: ${this.value} - À implémenter`);
    }
  });
});