document.addEventListener('DOMContentLoaded', () => {
  // Initialiser l'application si elle n'est pas déjà initialisée
  if (!window.app) {
    window.app = {
      API_BASE_URL: 'http://localhost:3000',
      getUserSession: () => JSON.parse(localStorage.getItem('userSession')),
      saveUserSession: (data) => localStorage.setItem('userSession', JSON.stringify(data))
    };
  }

  // Configuration des formulaires
  setupLoginForm();
  setupRegisterForm();
  setupForgotPasswordForm();
  setupPostCreation();
  setupSearch();
  setupNotifications();
  setupProfilePage();
});

// Formulaire de connexion
function setupLoginForm() {
  const loginForm = document.querySelector('form[action*="login"]');
  
  if (!loginForm) return;

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginForm.querySelector('#email').value;
    const password = loginForm.querySelector('#password').value;
    
    // Validation
    if (!email || !password) {
      showError(loginForm, 'Veuillez remplir tous les champs');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        // Sauvegarder la session
        if (window.app.saveUserSession) {
          window.app.saveUserSession(data);
        } else {
          localStorage.setItem('userSession', JSON.stringify(data));
        }
        
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
      } else {
        showError(loginForm, data.message || 'Identifiants incorrects');
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      showError(loginForm, 'Erreur de connexion au serveur');
    }
  });
}

// Formulaire d'inscription
function setupRegisterForm() {
  const registerForm = document.querySelector('form[action*="register"]');
  
  if (!registerForm) return;

  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fullname = registerForm.querySelector('#fullname').value;
    const email = registerForm.querySelector('#email').value;
    const username = registerForm.querySelector('#username').value;
    const password = registerForm.querySelector('#password').value;
    const birthdate = registerForm.querySelector('#birthdate').value;
    
    // Validation
    if (!fullname || !email || !username || !password || !birthdate) {
      showError(registerForm, 'Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 8) {
      showError(registerForm, 'Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    // Vérifier l'âge (au moins 13 ans)
    const birthDate = new Date(birthdate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13) {
      showError(registerForm, 'Vous devez avoir au moins 13 ans pour créer un compte');
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullname, email, username, password, birthdate })
      });

      const data = await response.json();

      if (data.success) {
        // Sauvegarder la session
        if (window.app.saveUserSession) {
          window.app.saveUserSession(data);
        } else {
          localStorage.setItem('userSession', JSON.stringify(data));
        }
        
        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
      } else {
        showError(registerForm, data.message || 'Erreur lors de l\'inscription');
      }
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      showError(registerForm, 'Erreur de connexion au serveur');
    }
  });
}

// Formulaire de mot de passe oublié
function setupForgotPasswordForm() {
  const forgotForm = document.getElementById('forgot-password-form');
  
  if (!forgotForm) return;

  forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = forgotForm.querySelector('#email').value;
    const resetBtn = forgotForm.querySelector('#reset-btn');
    const btnText = forgotForm.querySelector('#btn-text');
    const btnLoading = forgotForm.querySelector('#btn-loading');
    const successMessage = document.getElementById('success-message');
    
    // Validation de l'email
    if (!email || !isValidEmail(email)) {
      showError(forgotForm, 'Veuillez entrer une adresse email valide');
      return;
    }

    // Afficher l'indicateur de chargement
    resetBtn.disabled = true;
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';

    // Simuler l'envoi d'email (dans une vraie application, cela enverrait un vrai email)
    setTimeout(() => {
      // Réinitialiser le bouton
      resetBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
      
      // Afficher le message de succès
      forgotForm.style.display = 'none';
      successMessage.style.display = 'block';
      
      // Enregistrer dans la console pour le débogage
      console.log(`Email de réinitialisation envoyé à: ${email}`);
    }, 2000);
  });
}

// Création de post
function setupPostCreation() {
  const postCreator = document.querySelector('.post-creator');
  
  if (!postCreator) return;

  const textarea = postCreator.querySelector('textarea');
  const postButton = postCreator.querySelector('.btn-primary');
  
  if (postButton && textarea) {
    postButton.addEventListener('click', async () => {
      const content = textarea.value.trim();
      
      if (!content) {
        alert('Veuillez écrire quelque chose avant de poster');
        return;
      }

      const userSession = window.app.getUserSession ? 
        window.app.getUserSession() : 
        JSON.parse(localStorage.getItem('userSession'));

      if (!userSession) {
        alert('Veuillez vous connecter pour poster');
        window.location.href = 'login.html';
        return;
      }

      try {
        // Créer le post
        const newPost = {
          id: Date.now().toString(),
          content,
          authorId: userSession.user.id,
          authorName: userSession.user.fullname,
          authorHandle: `@${userSession.user.username}`,
          authorAvatar: userSession.user.avatar,
          likes: 0,
          retweets: 0,
          comments: 0,
          timestamp: new Date().toISOString(),
          isLiked: false,
          isRetweeted: false
        };

        // Dans une vraie application, envoyer à l'API
        // const response = await fetch('http://localhost:3000/posts', {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'Authorization': `Bearer ${userSession.token}`
        //   },
        //   body: JSON.stringify(newPost)
        // });

        // Pour le moment, on simule juste
        console.log('Post créé:', newPost);
        
        // Réinitialiser le textarea
        textarea.value = '';
        
        // Ajouter le post à la timeline (simulation)
        addPostToTimeline(newPost);
        
        // Afficher un message de succès
        showSuccessMessage('Post publié avec succès!');
        
      } catch (error) {
        console.error('Erreur lors de la création du post:', error);
        showError(postCreator, 'Erreur lors de la publication');
      }
    });
  }
}

// Recherche
function setupSearch() {
  const searchInputs = document.querySelectorAll('.search-container input, #main-search');
  
  searchInputs.forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        const searchTerm = encodeURIComponent(input.value.trim());
        window.location.href = `explorer.html?search=${searchTerm}`;
      }
    });
  });
}

// Notifications
function setupNotifications() {
  const markAllReadBtn = document.getElementById('mark-all-read');
  const notificationItems = document.querySelectorAll('.notification.unread');
  
  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', () => {
      notificationItems.forEach(item => {
        item.classList.remove('unread');
      });
      
      // Mettre à jour le badge
      const badges = document.querySelectorAll('.notification-badge');
      badges.forEach(badge => {
        badge.textContent = '0';
      });
      
      showSuccessMessage('Toutes les notifications marquées comme lues');
    });
  }
}

// Page profil
function setupProfilePage() {
  const editProfileBtn = document.getElementById('edit-profile-btn');
  const followBtn = document.getElementById('follow-btn');
  
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      // Dans une vraie application, cela ouvrirait un modal d'édition
      alert('Fonctionnalité d\'édition de profil à venir!');
    });
  }
  
  if (followBtn) {
    followBtn.addEventListener('click', () => {
      const isFollowing = followBtn.textContent === 'Suivi';
      
      if (isFollowing) {
        followBtn.textContent = 'Suivre';
        followBtn.classList.remove('following');
        showSuccessMessage('Vous ne suivez plus cet utilisateur');
      } else {
        followBtn.textContent = 'Suivi';
        followBtn.classList.add('following');
        showSuccessMessage('Vous suivez maintenant cet utilisateur');
      }
    });
  }
}

// Fonctions utilitaires
function showError(formElement, message) {
  // Nettoyer les erreurs précédentes
  const existingErrors = formElement.querySelectorAll('.error-message');
  existingErrors.forEach(error => error.remove());
  
  // Créer et afficher le message d'erreur
  const errorElement = document.createElement('div');
  errorElement.className = 'error-message';
  errorElement.textContent = message;
  errorElement.style.color = '#ff4d4d';
  errorElement.style.marginTop = '10px';
  errorElement.style.padding = '10px';
  errorElement.style.backgroundColor = '#ffe6e6';
  errorElement.style.borderRadius = '4px';
  errorElement.style.border = '1px solid #ff4d4d';
  
  formElement.prepend(errorElement);
  
  // Supprimer le message après 5 secondes
  setTimeout(() => {
    errorElement.remove();
  }, 5000);
}

function showSuccessMessage(message) {
  // Créer un élément de message temporaire
  const messageElement = document.createElement('div');
  messageElement.textContent = message;
  messageElement.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 15px 25px;
    border-radius: 4px;
    z-index: 1000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    animation: slideIn 0.3s ease-out;
  `;
  
  document.body.appendChild(messageElement);
  
  // Supprimer le message après 3 secondes
  setTimeout(() => {
    messageElement.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      document.body.removeChild(messageElement);
    }, 300);
  }, 3000);
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function addPostToTimeline(post) {
  const timeline = document.querySelector('.timeline');
  
  if (!timeline) return;
  
  const postElement = document.createElement('div');
  postElement.className = 'post';
  postElement.innerHTML = `
    <div class="post-avatar">
      <img src="${post.authorAvatar}" alt="Avatar">
    </div>
    <div class="post-content">
      <div class="post-header">
        <span class="post-author">${post.authorName}</span>
        <span class="post-handle">${post.authorHandle} · À l'instant</span>
      </div>
      <div class="post-text">${post.content}</div>
      <div class="post-actions">
        <button class="post-action">
          <i class="far fa-comment"></i>
          <span>0</span>
        </button>
        <button class="post-action">
          <i class="fas fa-retweet"></i>
          <span>0</span>
        </button>
        <button class="post-action">
          <i class="far fa-heart"></i>
          <span>0</span>
        </button>
        <button class="post-action">
          <i class="far fa-share-square"></i>
        </button>
      </div>
    </div>
  `;
  
  // Ajouter en haut de la timeline
  timeline.prepend(postElement);
}

// Ajouter les styles d'animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);