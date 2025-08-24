// Global variables
let cart = [];
let products = [];

// API endpoints
const API_BASE_URL = 'http://localhost:3000';

// DOM elements
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
    startCountdown();
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
                <div class="d-flex justify-content-between align-items-center">
                    <span class="product-price">AED ${product.price.toFixed(2)}</span>
                    <button class="btn btn-pink btn-sm rounded-circle" onclick="addToCart(${product.id})" style="width: 40px; height: 40px; padding: 0;">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
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
    if (cart.length === 0) {
        showToast('Your cart is empty', 'warning');
        return;
    }

    // Simple checkout without authentication
    cart = [];
    saveCart();
    updateCartCount();
    showToast('Order placed successfully!', 'success');
    
    const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
    cartModal.hide();
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

// Countdown Timer Function
function startCountdown() {
    // Set the end date (7 days from now)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    
    function updateCountdown() {
        const now = new Date().getTime();
        const distance = endDate.getTime() - now;
        
        if (distance < 0) {
            // Sale has ended
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }
        
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        
        document.getElementById('days').textContent = days.toString().padStart(2, '0');
        document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
        document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
    }
    
    // Update countdown every second
    updateCountdown();
    setInterval(updateCountdown, 1000);
}



