// Global variables
let cart = [];
let products = [];
let currentUser = null;

// API endpoints
const API_BASE_URL = 'http://localhost:3000';
const PYTHON_API_URL = 'http://localhost:5000';

// DOM elements
const loginBtn = document.getElementById('loginBtn');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.querySelector('.cart-count');
const featuredProducts = document.getElementById('featuredProducts');
const cartItems = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const checkoutBtn = document.getElementById('checkoutBtn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    loadCategories();
    loadCart();
    setupEventListeners();
    initializeModalForms(); // Initialize modal form handlers
    checkAuthStatus(); // Check authentication status on page load
    showToast('Welcome to Nature Republic! 💖', 'success');
});

// Setup event listeners
function setupEventListeners() {
    // Cart button
    cartBtn.addEventListener('click', () => {
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
        renderCart();
    });

    // Checkout button
    checkoutBtn.addEventListener('click', handleCheckout);

    // Login button (direct handler)
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            // Only handle if it's the login button (not the dropdown)
            if (e.target.closest('.btn-outline-pink') && !currentUser) {
                openLoginModal();
            }
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Listen for category refresh messages from admin panel
    window.addEventListener('message', function(event) {
        if (event.data.type === 'refreshCategories') {
            loadCategories();
        }
    });
}

// Load products from API
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        products = await response.json();
        renderFeaturedProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
    }
}

// Load categories from API
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const categories = await response.json();
        renderCategoriesSection(categories);
        updateCategoryDropdown(categories);
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories', 'error');
    }
}

// Render featured products
function renderFeaturedProducts() {
    const featured = products.filter(product => product.featured).slice(0, 8);
    
    featuredProducts.innerHTML = featured.map(product => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="product-card fade-in">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x300/ff69b4/ffffff?text=Beauty+Product'">
                </div>
                <div class="product-info">
                    <h5 class="product-title">
                        <a href="product.html?id=${product.id}" class="text-decoration-none text-dark">
                            ${product.name}
                        </a>
                    </h5>
                    <div class="product-rating">
                        ${generateStars(product.rating)}
                        <span class="ms-2">(${product.reviewCount})</span>
                    </div>
                    <p class="product-description">${product.description.substring(0, 80)}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="product-price">AED ${product.price.toFixed(2)}</span>
                        <div class="d-flex gap-2">
                            <a href="product.html?id=${product.id}" class="btn btn-outline-pink btn-sm">
                                <i class="fas fa-eye"></i> View
                            </a>
                            <button class="btn btn-pink btn-sm" onclick="addToCart(${product.id})">
                                <i class="fas fa-plus"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render categories section
function renderCategoriesSection(categories) {
    const categoriesContainer = document.querySelector('.categories-section .row');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = categories.map(category => `
        <div class="col-md-3 col-sm-6 mb-4">
            <div class="category-card">
                <div class="category-icon">
                    <i class="${category.icon || 'fas fa-tag'}"></i>
                </div>
                <h4>${category.name}</h4>
                <p>${category.description || 'Explore our amazing products'}</p>
                <a href="category.html?category=${encodeURIComponent(category.name)}" class="btn btn-outline-pink btn-sm">
                    View Products
                </a>
            </div>
        </div>
    `).join('');
}

// Update category dropdown in navigation
function updateCategoryDropdown(categories) {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (!dropdownMenu) return;
    
    dropdownMenu.innerHTML = categories.map(category => `
        <li><a class="dropdown-item" href="category.html?category=${encodeURIComponent(category.name)}">${category.name}</a></li>
    `).join('');
}

// Filter products by category - redirect to category page
function filterByCategory(categoryName) {
    window.location.href = `category.html?category=${encodeURIComponent(categoryName)}`;
}

// Generate star rating HTML
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return `
        ${'<i class="fas fa-star"></i>'.repeat(fullStars)}
        ${hasHalfStar ? '<i class="fas fa-star-half-alt"></i>' : ''}
        ${'<i class="far fa-star"></i>'.repeat(emptyStars)}
    `;
}

// Add product to cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    showToast(`${product.name} added to cart!`, 'success');
}

// Remove product from cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
    showToast('Item removed from cart', 'info');
}

// Update cart item quantity
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;

    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartCount();
        renderCart();
    }
}

// Render cart items
function renderCart() {
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <p class="text-muted">Your cart is empty</p>
                <button class="btn btn-pink" data-bs-dismiss="modal">Continue Shopping</button>
            </div>
        `;
        cartTotal.textContent = '0.00';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80x80/ff69b4/ffffff?text=Product'">
            </div>
            <div class="cart-item-details">
                <h6 class="cart-item-title">${item.name}</h6>
                <p class="cart-item-price">AED ${item.price.toFixed(2)}</p>
            </div>
            <div class="quantity-controls">
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="mx-2">${item.quantity}</span>
                <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="ms-3">
                <span class="fw-bold">AED ${(item.price * item.quantity).toFixed(2)}</span>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
}

// Update cart count badge
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = count;
}

// Save cart to localStorage
function saveCart() {
    localStorage.setItem('natureRepublicCart', JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const savedCart = localStorage.getItem('natureRepublicCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}





// Handle checkout
async function handleCheckout() {
    if (!currentUser) {
        showToast('Please login to checkout', 'warning');
        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        cartModal.hide();
        
        // Open login modal instead of redirecting
        openLoginModal();
        return;
    }

    if (cart.length === 0) {
        showToast('Your cart is empty', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('natureRepublicToken')}`
            },
            body: JSON.stringify({
                items: cart,
                total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            cart = [];
            saveCart();
            updateCartCount();
            showToast('Order placed successfully!', 'success');
            
            const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
            cartModal.hide();
        } else {
            showToast(data.message || 'Checkout failed', 'error');
        }
    } catch (error) {
        console.error('Checkout error:', error);
        showToast('Checkout failed. Please try again.', 'error');
    }
}

// Handle search
function handleSearch(event) {
    const query = event.target.value.toLowerCase();
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        const description = card.querySelector('.product-description').textContent.toLowerCase();
        
        if (title.includes(query) || description.includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast show`;
    toast.innerHTML = `
                 <div class="toast-header">
             <i class="fas fa-${getToastIcon(type)} text-${getToastColor(type)} me-2"></i>
             <strong class="me-auto">Nature Republic</strong>
             <button type="button" class="btn-close" onclick="this.parentElement.parentElement.remove()"></button>
         </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Create toast container
function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Get toast icon
function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Get toast color
function getToastColor(type) {
    const colors = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'info'
    };
    return colors[type] || 'info';
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if user is logged in on page load
function checkAuthStatus() {
    const user = localStorage.getItem('natureRepublicUser');
    const token = localStorage.getItem('natureRepublicToken');
    
    if (user && token) {
        try {
            currentUser = JSON.parse(user);
            updateNavigationForUser();
        } catch (e) {
            // Invalid user data, clear it
            localStorage.removeItem('natureRepublicUser');
            localStorage.removeItem('natureRepublicToken');
        }
    }
}

// Update navigation for authenticated user
function updateNavigationForUser() {
    const loginBtn = document.getElementById('loginBtn');
    if (currentUser) {
        loginBtn.innerHTML = `
            <div class="user-menu">
                <span class="user-name">
                    <i class="fas fa-user"></i> ${currentUser.name}
                </span>
                <div class="user-actions">
                    <button class="btn btn-sm btn-outline-pink" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        `;
    } else {
        loginBtn.innerHTML = `
            <button class="btn btn-outline-pink" onclick="openLoginModal()">
                <i class="fas fa-user"></i> Login
            </button>
        `;
    }
}

// User profile functions
function viewProfile() {
    if (!currentUser) return;
    
    showToast(`Welcome back, ${currentUser.name}!`, 'success');
    // You can implement a profile modal here
}

function viewOrders() {
    if (!currentUser) return;
    
    showToast('Orders feature coming soon!', 'info');
    // You can implement an orders view here
}

function logout() {
    localStorage.removeItem('natureRepublicUser');
    localStorage.removeItem('natureRepublicToken');
    currentUser = null;
    updateNavigationForUser();
    showToast('Logged out successfully', 'success');
}

// Modal handling functions
function openLoginModal() {
    const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
    loginModal.show();
}

// Initialize modal form handlers
function initializeModalForms() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            try {
                const response = await fetch('http://localhost:5000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Store user data and token
                    localStorage.setItem('natureRepublicUser', JSON.stringify(data.user));
                    localStorage.setItem('natureRepublicToken', data.token);
                    
                    // Update current user
                    currentUser = data.user;
                    
                    // Update navigation
                    updateNavigationForUser();
                    
                    // Close modal
                    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    loginModal.hide();
                    
                    // Clear form
                    loginForm.reset();
                    
                    // Show success message
                    showToast(`Welcome back, ${data.user.name}!`, 'success');
                    
                    // Redirect admin to admin panel
                    if (data.user.role === 'admin') {
                        window.location.href = 'admin.html';
                    }
                } else {
                    const errorData = await response.json();
                    showToast(errorData.message || 'Login failed', 'error');
                }
            } catch (error) {
                console.error('Login error:', error);
                showToast('Login failed. Please try again.', 'error');
            }
        });
    }
    
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const name = document.getElementById('registerName').value;
            const email = document.getElementById('registerEmail').value;
            const password = document.getElementById('registerPassword').value;
            
            try {
                const response = await fetch('http://localhost:5000/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    // Store user data and token
                    localStorage.setItem('natureRepublicUser', JSON.stringify(data.user));
                    localStorage.setItem('natureRepublicToken', data.token);
                    
                    // Update current user
                    currentUser = data.user;
                    
                    // Update navigation
                    updateNavigationForUser();
                    
                    // Close modal
                    const registerModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    registerModal.hide();
                    
                    // Clear form
                    registerForm.reset();
                    
                    // Show success message
                    showToast(`Welcome to Nature Republic, ${data.user.name}!`, 'success');
                } else {
                    const errorData = await response.json();
                    showToast(errorData.message || 'Registration failed', 'error');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showToast('Registration failed. Please try again.', 'error');
            }
        });
    }
}