document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const userStatusNav = document.getElementById('user-status');
    const authSection = document.getElementById('auth-section');
    const postsSection = document.getElementById('posts-section');
    const postsListContainer = document.getElementById('posts-list'); // Added for posts
    const userActionsSection = document.getElementById('user-actions');
    const createPostFormContainer = document.getElementById('create-post-form-container');
    const createPostForm = document.getElementById('create-post-form'); // Added this selector
    
    // Forms and Buttons (will be used more in later subtasks)
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    // const createPostForm = document.getElementById('create-post-form'); // Already declared above
    const logoutButton = document.getElementById('logout-button');
    const showCreatePostFormButton = document.getElementById('show-create-post-form-button');

    // --- API Base URL ---
    const API_BASE_URL = 'http://localhost:3000/api'; // Assuming backend runs on port 3000

    // --- State ---
    let isLoggedIn = false;
    let currentUser = null; // Example: { id: 1, username: 'testuser' }
    let token = null;

    // --- UI Update Functions ---
    function updateToken(newToken) {
        token = newToken;
        if (newToken) {
            localStorage.setItem('jwtToken', newToken);
            // Decode and set current user when token is updated
            try {
                const payload = JSON.parse(atob(newToken.split('.')[1]));
                currentUser = payload.user || { username: 'User' }; 
            } catch (e) {
                console.error("Error decoding token for username:", e);
                currentUser = { username: 'User' }; // Fallback
            }
        } else {
            localStorage.removeItem('jwtToken');
            currentUser = null;
        }
    }

    function updateUserStatusUI() {
        userStatusNav.innerHTML = ''; // Clear previous status

        if (isLoggedIn && currentUser) {
            const statusText = document.createElement('p');
            statusText.textContent = `Logged in as ${currentUser.username}`;
            userStatusNav.appendChild(statusText);
        } else {
            const statusText = document.createElement('p');
            statusText.textContent = 'You are not logged in.';
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
        postsSection.style.display = 'block'; // Show posts list
        userActionsSection.style.display = 'block'; // Show logout, create post buttons
        createPostFormContainer.style.display = 'none'; // Keep create form hidden initially
        fetchAndDisplayPosts(); // Fetch posts when showing dashboard
    }
    
    function showCreatePostFormView() {
        if(isLoggedIn) {
            createPostFormContainer.style.display = 'block';
        }
    }

    // --- Event Listeners (basic setup) ---

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = loginForm.username.value;
            const password = loginForm.password.value;

            if (!username || !password) {
                alert('Please enter both username and password to log in.');
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
                    updateToken(data.token); // This will also update currentUser
                    loginForm.reset();
                    updateUserStatusUI();
                    showUserDashboardView();
                } else {
                    isLoggedIn = false;
                    updateToken(null);
                    alert(`Login failed: ${data.message || response.statusText}`);
                    updateUserStatusUI(); // Ensure UI reflects logged-out state
                    showAuthView();       // Ensure auth forms are shown
                }
            } catch (error) {
                console.error('Login error:', error);
                isLoggedIn = false;
                updateToken(null);
                alert('An error occurred during login. Please try again.');
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
                alert('Please enter both username and password for registration.');
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
                    alert(`Registration successful for ${username}! You can now log in.`);
                    registerForm.reset();
                    // Optionally switch to login view or clear forms etc.
                    // For now, just an alert. User can manually go to login.
                } else {
                    alert(`Registration failed: ${data.message || response.statusText}`);
                }
            } catch (error) {
                console.error('Registration error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            try {
                // Optional: Call backend logout endpoint
                // The actual logout (token invalidation) is handled by the client deleting the token
                const response = await fetch(`${API_BASE_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // 'Authorization': `Bearer ${token}` // If your logout endpoint requires auth
                    },
                });
                if (!response.ok) {
                    // Log error but proceed with client-side logout
                    console.warn('Backend logout call failed or was not successful, but proceeding with client-side logout.');
                }
            } catch (error) {
                console.error('Error calling backend logout:', error);
                // Proceed with client-side logout even if backend call fails
            }
            
            isLoggedIn = false;
            updateToken(null); // Clears token from state and localStorage, and clears currentUser
            updateUserStatusUI();
            showAuthView();
        });
    }

    if (showCreatePostFormButton) {
        showCreatePostFormButton.addEventListener('click', () => {
            console.log('Show create post form button clicked');
            showCreatePostFormView();
        });
    }
    
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const title = createPostForm.title.value;
            const content = createPostForm.content.value;

            if (!title.trim() || !content.trim()) {
                alert('Please enter both title and content for your post.');
                return;
            }

            const currentToken = localStorage.getItem('jwtToken'); // Use the global 'token' if preferred and always up-to-date
            if (!currentToken) {
                alert('Authentication error. Please log in again.');
                // Optionally redirect to login or show login form
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

                if (response.ok) { // Typically 201 Created for POST
                    alert('Post created successfully!');
                    createPostForm.reset();
                    createPostFormContainer.style.display = 'none'; // Hide form
                    await fetchAndDisplayPosts(); // Refresh the posts list
                } else {
                    alert(`Error creating post: ${responseData.message || response.statusText}`);
                }
            } catch (error) {
                console.error('Create post error:', error);
                alert('An error occurred while creating the post. Please try again.');
            }
        });
    }


    // --- Post Fetching and Display ---
    async function fetchAndDisplayPosts() {
        if (!postsListContainer) {
            console.error('Posts list container not found!');
            return;
        }
        postsListContainer.innerHTML = '<p>Loading posts...</p>'; // Clear and show loading

        try {
            const response = await fetch(`${API_BASE_URL}/posts`); // No auth needed for GET all posts
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error fetching posts: ${response.statusText}`);
            }
            const posts = await response.json();

            postsListContainer.innerHTML = ''; // Clear loading message

            if (posts.length === 0) {
                postsListContainer.innerHTML = '<p>No posts available yet. Be the first to create one!</p>';
                return;
            }

            posts.forEach(post => {
                const postElement = document.createElement('article');
                postElement.classList.add('post-entry');
                postElement.setAttribute('data-post-id', post.id);

                const title = document.createElement('h4');
                title.textContent = post.title;

                const contentSnippet = document.createElement('p');
                // Display full content if short, or a snippet
                contentSnippet.textContent = post.content.length > 150 
                    ? `${post.content.substring(0, 147)}...` 
                    : post.content;
                
                const authorInfo = document.createElement('small');
                const postDate = new Date(post.created_at).toLocaleDateString('en-US', { 
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                });
                authorInfo.textContent = `By ${post.username || 'Unknown author'} on ${postDate}`;
                authorInfo.classList.add('post-meta');

                const readMoreLink = document.createElement('a');
                readMoreLink.href = '#'; // Or a specific link like `#/posts/${post.id}` for SPA routing
                readMoreLink.textContent = 'Read more';
                readMoreLink.classList.add('read-more-link');
                readMoreLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log(`Read more clicked for post ID: ${post.id}`);
                    alert(`Post Title: ${post.title}\n\nFull Content:\n${post.content}\n\nAuthor: ${post.username}`);
                    // Future: Implement single post view (modal, new section, or page)
                });

                postElement.appendChild(title);
                postElement.appendChild(contentSnippet);
                postElement.appendChild(authorInfo);
                postElement.appendChild(readMoreLink);
                postsListContainer.appendChild(postElement);
            });

        } catch (error) {
            console.error('Failed to fetch posts:', error);
            postsListContainer.innerHTML = `<p class="error-message">Could not load posts: ${error.message}</p>`;
        }
    }

    // --- Initial UI Setup ---
    function initializeUI() {
        const storedToken = localStorage.getItem('jwtToken');
        if (storedToken) {
            // TODO: Add token validation step here or fetch user profile
            // For now, assume token is valid if it exists
            token = storedToken;
            isLoggedIn = true;
            // updateToken will set currentUser from the storedToken
            updateToken(storedToken); 
            isLoggedIn = true;
            // No need to decode here again, updateToken does it.
            updateUserStatusUI();
            showUserDashboardView(); // This will now call fetchAndDisplayPosts
        } else {
            isLoggedIn = false;
            updateToken(null); // Ensures currentUser is null if no token
            updateUserStatusUI();
            showAuthView();
        }
    }

    initializeUI();
});
