const API_URL = 'http://localhost:3000';

// Vérifier l'authentification
function checkAuth() {
    const user = localStorage.getItem('currentUser');
    
    if (!user) {
        // Rediriger vers la page de connexion
        window.location.href = 'login.html';
        return null;
    }
    
    return JSON.parse(user);
}

// Mettre à jour l'interface utilisateur
function updateUI(user) {
    // Mettre à jour le nom dans la sidebar
    const profileName = document.querySelector('.profile-mini-name');
    const profileHandle = document.querySelector('.profile-mini-handle');
    
    if (profileName) profileName.textContent = user.fullname;
    if (profileHandle) profileHandle.textContent = '@' + user.username;
    
    // Changer les boutons de connexion/déconnexion
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        navActions.innerHTML = `
            <button class="btn btn-secondary" id="logout-btn">Déconnexion</button>
        `;
        
        // Ajouter l'événement de déconnexion
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
                    localStorage.removeItem('currentUser');
                    window.location.href = 'login.html';
                }
            });
        }
    }
}

// Charger les publications
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts?_sort=createdAt&_order=desc`);
        if (!response.ok) throw new Error('Erreur de chargement');
        
        const posts = await response.json();
        const timeline = document.getElementById('timeline');
        
        if (!timeline) return;
        
        // Supprimer les posts existants (sauf les posts statiques initiaux)
        const staticPosts = timeline.querySelectorAll('.post');
        if (posts.length > 0) {
            // Garder seulement le premier post statique comme exemple
            for (let i = 1; i < staticPosts.length; i++) {
                staticPosts[i].remove();
            }
        }
        
        // Afficher les posts de la base de données
        posts.forEach(post => {
            const postElement = createPostElement(post);
            timeline.appendChild(postElement);
        });
        
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Créer un élément post
function createPostElement(post) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const isMyPost = currentUser && post.userId === currentUser.id;
    
    // Formater la date
    const date = new Date(post.createdAt);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    let timeAgo;
    if (diffMins < 60) {
        timeAgo = `${diffMins} min`;
    } else if (diffHours < 24) {
        timeAgo = `${diffHours} h`;
    } else {
        timeAgo = `${diffDays} j`;
    }
    
    const postElement = document.createElement('article');
    postElement.className = 'post';
    postElement.innerHTML = `
        <div class="post-avatar">
            <img src="${post.avatar || './images/default-avatar.jpg'}" alt="Avatar" loading="lazy">
        </div>
        <div class="post-content">
            <div class="post-header">
                <div class="post-author-info">
                    <strong class="post-author">${isMyPost ? 'Moi' : post.author}</strong>
                    <span class="post-handle">@${post.username} · ${timeAgo}</span>
                </div>
                <button class="post-options" aria-label="Options de la publication">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
            </div>
            <div class="post-text">
                <p>${formatPostText(post.content)}</p>
            </div>
            <div class="post-actions">
                <button class="post-action" aria-label="Commenter">
                    <i class="far fa-comment"></i>
                    <span>${post.comments || 0}</span>
                </button>
                <button class="post-action" aria-label="Retweeter">
                    <i class="fas fa-retweet"></i>
                    <span>${post.retweets || 0}</span>
                </button>
                <button class="post-action" aria-label="Aimer">
                    <i class="far fa-heart"></i>
                    <span>${post.likes || 0}</span>
                </button>
                <button class="post-action" aria-label="Partager">
                    <i class="far fa-share-square"></i>
                </button>
            </div>
        </div>
    `;
    
    return postElement;
}

// Formater le texte du post
function formatPostText(text) {
    if (!text) return '';
    // Convertir les hashtags
    text = text.replace(/#(\w+)/g, '<a href="#" class="hashtag">#$1</a>');
    // Convertir les mentions
    text = text.replace(/@(\w+)/g, '<a href="#" class="mention">@$1</a>');
    // Convertir les sauts de ligne
    text = text.replace(/\n/g, '<br>');
    return text;
}

// Gérer la création de posts
function setupPostCreation() {
    const postTextarea = document.getElementById('post-textarea');
    const postSubmit = document.getElementById('post-submit');
    const charCounter = document.getElementById('char-counter');
    
    if (!postTextarea || !postSubmit || !charCounter) return;
    
    // Compteur de caractères
    postTextarea.addEventListener('input', function() {
        const length = this.value.length;
        const remaining = 280 - length;
        charCounter.textContent = remaining;
        
        // Changer la couleur selon le nombre de caractères restants
        if (remaining < 0) {
            charCounter.style.color = '#f4212e';
            postSubmit.disabled = true;
        } else if (remaining < 20) {
            charCounter.style.color = '#ffd400';
            postSubmit.disabled = length === 0;
        } else {
            charCounter.style.color = '#71767b';
            postSubmit.disabled = length === 0;
        }
    });
    
    // Publication du post
    postSubmit.addEventListener('click', async function() {
        const content = postTextarea.value.trim();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (!content) {
            alert('Le post ne peut pas être vide');
            return;
        }
        
        if (!currentUser) {
            alert('Vous devez être connecté pour poster');
            return;
        }
        
        try {
            const newPost = {
                content: content,
                author: currentUser.fullname,
                username: currentUser.username,
                userId: currentUser.id,
                avatar: currentUser.avatar || './images/image rachel.jpg',
                createdAt: new Date().toISOString(),
                likes: 0,
                retweets: 0,
                comments: 0
            };
            
            const response = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPost)
            });
            
            if (!response.ok) throw new Error('Erreur de publication');
            
            // Réinitialiser le formulaire
            postTextarea.value = '';
            charCounter.textContent = '280';
            charCounter.style.color = '#71767b';
            postSubmit.disabled = true;
            
            // Recharger les posts
            await loadPosts();
            
            // Message de succès
            alert('Post publié avec succès !');
            
        } catch (error) {
            alert('Erreur: ' + error.message);
        }
    });
}

// Gérer le menu mobile
function setupMobileMenu() {
    const hamburgerToggle = document.getElementById('hamburger-toggle');
    const mobileModal = document.getElementById('mobile-modal');
    const mobileModalClose = document.getElementById('mobile-modal-close');
    
    if (hamburgerToggle && mobileModal) {
        hamburgerToggle.addEventListener('click', function() {
            mobileModal.style.display = 'flex';
            mobileModal.setAttribute('aria-hidden', 'false');
        });
    }
    
    if (mobileModalClose && mobileModal) {
        mobileModalClose.addEventListener('click', function() {
            mobileModal.style.display = 'none';
            mobileModal.setAttribute('aria-hidden', 'true');
        });
    }
    
    // Fermer en cliquant à l'extérieur
    if (mobileModal) {
        mobileModal.addEventListener('click', function(e) {
            if (e.target === mobileModal) {
                mobileModal.style.display = 'none';
                mobileModal.setAttribute('aria-hidden', 'true');
            }
        });
    }
}

// Initialisation
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Main.js chargé');
    
    // Vérifier l'authentification
    const user = checkAuth();
    if (!user) return;
    
    // Mettre à jour l'interface
    updateUI(user);
    
    // Charger les publications
    await loadPosts();
    
    // Configurer la création de posts
    setupPostCreation();
    
    // Configurer le menu mobile
    setupMobileMenu();
});