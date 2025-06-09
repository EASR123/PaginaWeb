document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos del DOM ---
    const userStatusNav = document.getElementById('user-status');
    const authSection = document.getElementById('auth-section');
    const postsSection = document.getElementById('posts-section');
    const postsListContainer = document.getElementById('posts-list');
    const userActionsSection = document.getElementById('user-actions');
    const createPostFormContainer = document.getElementById('create-post-form-container');
    const createPostForm = document.getElementById('create-post-form');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const logoutButton = document.getElementById('logout-button');
    const showCreatePostFormButton = document.getElementById('show-create-post-form-button');

    // --- URL Base de la API ---
    const API_BASE_URL = '/api';

    // --- Estado ---
    let isLoggedIn = false;
    let currentUser = null;
    let token = null;

    // --- Funciones para actualizar la UI ---
    function updateToken(newToken) {
        token = newToken;
        if (newToken) {
            localStorage.setItem('jwtToken', newToken);
            try {
                const payload = JSON.parse(atob(newToken.split('.')[1]));
                currentUser = payload.user || { username: 'Usuario' };
            } catch (e) {
                console.error("Error decodificando el token:", e);
                currentUser = { username: 'Usuario' };
            }
        } else {
            localStorage.removeItem('jwtToken');
            currentUser = null;
        }
    }

    function updateUserStatusUI() {
        userStatusNav.innerHTML = '';

        if (isLoggedIn && currentUser) {
            const statusText = document.createElement('p');
            statusText.textContent = `Conectado como ${currentUser.username}`;
            userStatusNav.appendChild(statusText);
        } else {
            const statusText = document.createElement('p');
            statusText.textContent = 'No has iniciado sesión.';
            userStatusNav.appendChild(statusText);
        }
    }

    function showAuthView() {
        authSection.style.display = 'block';
        postsSection.style.display = 'none';
        userActionsSection.style.display = 'none';
        createPostFormContainer.style.display = 'none';
    }

    function showUserDashboardView() {
        authSection.style.display = 'none';
        postsSection.style.display = 'block';
        userActionsSection.style.display = 'block';
        createPostFormContainer.style.display = 'none';
        fetchAndDisplayPosts();
    }
    
    function showCreatePostFormView() {
        if(isLoggedIn) {
            createPostFormContainer.style.display = 'block';
            // Desplazarse suavemente al formulario
            createPostFormContainer.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // --- Manejadores de Eventos ---
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            if (!username || !password) {
                mostrarNotificacion('Por favor ingresa nombre de usuario y contraseña.', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok && data.token) {
                    isLoggedIn = true;
                    updateToken(data.token);
                    loginForm.reset();
                    updateUserStatusUI();
                    showUserDashboardView();
                    mostrarNotificacion('¡Inicio de sesión exitoso!', 'success');
                } else {
                    isLoggedIn = false;
                    updateToken(null);
                    mostrarNotificacion(`Error al iniciar sesión: ${data.message || response.statusText}`, 'error');
                    updateUserStatusUI();
                    showAuthView();
                }
            } catch (error) {
                console.error('Error en inicio de sesión:', error);
                isLoggedIn = false;
                updateToken(null);
                mostrarNotificacion('Ocurrió un error al iniciar sesión. Por favor intenta nuevamente.', 'error');
                updateUserStatusUI();
                showAuthView();
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = registerForm.username.value;
            const password = registerForm.password.value;

            if (!username || !password) {
                mostrarNotificacion('Por favor ingresa nombre de usuario y contraseña para registrarte.', 'error');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    mostrarNotificacion(`¡Registro exitoso para ${username}! Ahora puedes iniciar sesión.`, 'success');
                    registerForm.reset();
                    // Cambiar a la pestaña de login
                    document.getElementById('login-form-container').scrollIntoView({ behavior: 'smooth' });
                } else {
                    mostrarNotificacion(`Error en el registro: ${data.message || response.statusText}`, 'error');
                }
            } catch (error) {
                console.error('Error en registro:', error);
                mostrarNotificacion('Ocurrió un error durante el registro. Por favor intenta nuevamente.', 'error');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (!response.ok) {
                    console.warn('La llamada al backend para cerrar sesión falló, pero continuamos con el cierre de sesión del cliente.');
                }
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
            }
            
            isLoggedIn = false;
            updateToken(null);
            updateUserStatusUI();
            showAuthView();
            mostrarNotificacion('Has cerrado sesión correctamente.', 'info');
        });
    }

    if (showCreatePostFormButton) {
        showCreatePostFormButton.addEventListener('click', () => {
            showCreatePostFormView();
        });
    }
    
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = createPostForm.title.value;
            const content = createPostForm.content.value;

            if (!title.trim() || !content.trim()) {
                mostrarNotificacion('Por favor ingresa un título y contenido para tu publicación.', 'error');
                return;
            }

            const currentToken = localStorage.getItem('jwtToken');
            if (!currentToken) {
                mostrarNotificacion('Error de autenticación. Por favor inicia sesión nuevamente.', 'error');
                showAuthView();
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${currentToken}`,
                    },
                    body: JSON.stringify({ title, content }),
                });

                const responseData = await response.json();

                if (response.ok) {
                    mostrarNotificacion('¡Publicación creada con éxito!', 'success');
                    createPostForm.reset();
                    createPostFormContainer.style.display = 'none';
                    await fetchAndDisplayPosts();
                } else {
                    mostrarNotificacion(`Error al crear publicación: ${responseData.message || response.statusText}`, 'error');
                }
            } catch (error) {
                console.error('Error al crear publicación:', error);
                mostrarNotificacion('Ocurrió un error al crear la publicación. Por favor intenta nuevamente.', 'error');
            }
        });
    }

    // --- Funciones para manejar publicaciones ---
  async function fetchAndDisplayPosts() {
    if (!postsListContainer) {
        console.error('Contenedor de publicaciones no encontrado!');
        return;
    }
    
    // Mostrar esqueleto de carga
    postsListContainer.innerHTML = `
        <div class="skeleton-post">
            <div class="skeleton-title"></div>
            <div class="skeleton-content"></div>
            <div class="skeleton-meta"></div>
        </div>
        <div class="skeleton-post">
            <div class="skeleton-title"></div>
            <div class="skeleton-content"></div>
            <div class="skeleton-meta"></div>
        </div>
        <div class="skeleton-post">
            <div class="skeleton-title"></div>
            <div class="skeleton-content"></div>
            <div class="skeleton-meta"></div>
        </div>
    `;

    try {
        // Simulamos la respuesta de la API con tus publicaciones
        const today = new Date();
        const posts = [
            {
                id: 1,
                title: "Principio de Confidencialidad",
                content: "Solo las personas autorizadas deben acceder a la información:\n\n- Cifrar datos sensibles con AES-256\n- Implementar autenticación multifactor (MFA)\n- Control estricto de permisos\n\nEjemplo: Historiales médicos solo accesibles por personal médico autorizado.",
                username: "Sánchez Edgar",
                created_at: today.toISOString()
            },
            {
                id: 2,
                title: "Importancia de la Integridad",
                content: "La información debe mantenerse precisa y sin alteraciones no autorizadas:\n\n- Uso de hashing criptográfico (SHA-256)\n- Registros médicos electrónicos protegidos\n- Sistemas de versionado para cambios\n\nEjemplo: Alterar una dosis de medicamento podría ser fatal.",
                username: "Sánchez Edgar",
                created_at: today.toISOString()
            },
            {
                id: 3,
                title: "Disponibilidad 24/7",
                content: "La información debe estar accesible cuando se necesita:\n\n- Servidores redundantes en e-Commerce\n- Planes de recuperación ante desastres\n- Bases de datos replicadas en bancos\n\n¡Un minuto de inactividad puede costar millones!",
                username: "Sánchez Edgar",
                created_at: today.toISOString()
            },
            {
                id: 4,
                title: "Triada CIA en la Práctica",
                content: "Ejemplo en un hospital:\n\n1. Confidencialidad: Historias clínicas cifradas\n2. Integridad: Hashing en recetas médicas\n3. Disponibilidad: Generadores eléctricos\n\nSin CIA, los pacientes estarían en peligro.",
                username: "Sánchez Edgar",
                created_at: today.toISOString()
            },
            {
                id: 5,
                title: "Seguridad en Sistemas Bancarios",
                content: "Implementación de la triada CIA:\n\n- Confidencialidad: Tokens de acceso\n- Integridad: Firmas digitales en transacciones\n- Disponibilidad: Clústeres de servidores\n\nCumplimiento de regulaciones financieras.",
                username: "Sánchez Edgar",
                created_at: today.toISOString()
            }
        ];

        postsListContainer.innerHTML = '';

        posts.forEach(post => {
            const postElement = document.createElement('article');
            postElement.classList.add('post-entry');
            postElement.setAttribute('data-post-id', post.id);

            const title = document.createElement('h4');
            title.textContent = post.title;

            const contentSnippet = document.createElement('p');
            contentSnippet.textContent = post.content.length > 150 
                ? `${post.content.substring(0, 147)}...` 
                : post.content;
            
            const authorInfo = document.createElement('small');
            const postDate = new Date(post.created_at).toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
            });
            authorInfo.textContent = `Por ${post.username} el ${postDate}`;
            authorInfo.classList.add('post-meta');

            const readMoreLink = document.createElement('a');
            readMoreLink.href = '#';
            readMoreLink.textContent = 'Leer más';
            readMoreLink.classList.add('read-more-link');
            readMoreLink.addEventListener('click', (e) => {
                e.preventDefault();
                mostrarModalPublicacion(post);
            });

            postElement.appendChild(title);
            postElement.appendChild(contentSnippet);
            postElement.appendChild(authorInfo);
            postElement.appendChild(readMoreLink);
            postsListContainer.appendChild(postElement);
        });

    } catch (error) {
        console.error('Error al obtener publicaciones:', error);
        postsListContainer.innerHTML = `
            <p class="error-message">
                No se pudieron cargar las publicaciones. Mostrando datos de ejemplo...
            </p>
        `;
        
        // Forzar la visualización de las publicaciones aunque falle la API
        fetchAndDisplayPosts();
    }
}

    // --- Funciones auxiliares ---
    function mostrarNotificacion(mensaje, tipo = 'info') {
        // Eliminar notificación anterior si existe
        const notificacionAnterior = document.querySelector('.notificacion-flotante');
        if (notificacionAnterior) {
            notificacionAnterior.remove();
        }

        const notificacion = document.createElement('div');
        notificacion.className = `notificacion-flotante notificacion-${tipo}`;
        notificacion.textContent = mensaje;
        
        document.body.appendChild(notificacion);
        
        // Mostrar notificación
        setTimeout(() => {
            notificacion.classList.add('mostrar');
        }, 10);
        
        // Ocultar después de 5 segundos
        setTimeout(() => {
            notificacion.classList.remove('mostrar');
            setTimeout(() => {
                notificacion.remove();
            }, 300);
        }, 5000);
    }

    function mostrarModalPublicacion(post) {
        const modal = document.createElement('div');
        modal.className = 'modal-publicacion';
        modal.innerHTML = `
            <div class="modal-contenido">
                <span class="cerrar-modal">&times;</span>
                <h3>${post.title}</h3>
                <div class="modal-meta">
                    <small>Por ${post.username || 'Autor desconocido'} el ${new Date(post.created_at).toLocaleDateString('es-ES', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}</small>
                </div>
                <div class="modal-contenido-texto">
                    ${post.content.replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Cerrar modal al hacer clic en la X
        modal.querySelector('.cerrar-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Cerrar modal al hacer clic fuera del contenido
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    // --- Inicialización ---
    function initializeUI() {
        const storedToken = localStorage.getItem('jwtToken');
        if (storedToken) {
            token = storedToken;
            isLoggedIn = true;
            updateToken(storedToken); 
            isLoggedIn = true;
            updateUserStatusUI();
            showUserDashboardView();
        } else {
            isLoggedIn = false;
            updateToken(null);
            updateUserStatusUI();
            showAuthView();
        }
        
        // Agregar estilos para notificaciones dinámicamente
        const estiloNotificaciones = document.createElement('style');
        estiloNotificaciones.textContent = `
            .notificacion-flotante {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 25px;
                border-radius: 5px;
                color: white;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transform: translateX(120%);
                transition: transform 0.3s ease-out;
                z-index: 1000;
            }
            
            .notificacion-flotante.mostrar {
                transform: translateX(0);
            }
            
            .notificacion-error {
                background-color: var(--danger-color);
            }
            
            .notificacion-success {
                background-color: var(--success-color);
            }
            
            .notificacion-info {
                background-color: var(--primary-color);
            }
            
            /* Estilos para el modal */
            .modal-publicacion {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1001;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .modal-publicacion.mostrar {
                opacity: 1;
            }
            
            .modal-contenido {
                background-color: white;
                padding: 2rem;
                border-radius: var(--border-radius);
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }
            
            .cerrar-modal {
                position: absolute;
                top: 1rem;
                right: 1rem;
                font-size: 1.5rem;
                cursor: pointer;
                color: var(--secondary-color);
            }
            
            .cerrar-modal:hover {
                color: var(--danger-color);
            }
            
            .modal-contenido h3 {
                margin-bottom: 1rem;
                color: var(--text-color);
            }
            
            .modal-meta {
                margin-bottom: 1.5rem;
                color: var(--secondary-color);
            }
            
            .modal-contenido-texto {
                line-height: 1.8;
                white-space: pre-line;
            }
            
            /* Esqueletos de carga */
            .skeleton-post {
                background: white;
                padding: 1.5rem;
                border-radius: var(--border-radius);
                margin-bottom: 1.5rem;
            }
            
            .skeleton-title {
                height: 1.8rem;
                width: 70%;
                background: #e9ecef;
                margin-bottom: 1rem;
                border-radius: 4px;
                animation: skeleton-loading 1.5s infinite ease-in-out;
            }
            
            .skeleton-content {
                height: 1rem;
                width: 100%;
                background: #e9ecef;
                margin-bottom: 0.5rem;
                border-radius: 4px;
                animation: skeleton-loading 1.5s infinite ease-in-out;
            }
            
            .skeleton-content:last-child {
                width: 80%;
            }
            
            .skeleton-meta {
                height: 0.8rem;
                width: 50%;
                background: #e9ecef;
                margin-top: 1rem;
                border-radius: 4px;
                animation: skeleton-loading 1.5s infinite ease-in-out;
            }
            
            @keyframes skeleton-loading {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
            }
        `;
        document.head.appendChild(estiloNotificaciones);
    }

    initializeUI();
});
