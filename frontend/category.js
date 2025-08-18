// Category Page JavaScript
let allProducts = [];
let filteredProducts = [];
let currentCategory = '';
let currentPage = 1;
let productsPerPage = 12;
let currentSort = { field: 'name', order: 'asc' };
let cart = [];
let currentUser = null;

// API endpoints
const API_BASE_URL = 'http://localhost:3000';
const PYTHON_API_URL = 'http://localhost:5000';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get category from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentCategory = urlParams.get('category');
    
    if (!currentCategory) {
        window.location.href = 'index.html';
        return;
    }
    
    // Initialize the page
    initializePage();
    loadProducts();
    loadCart();
    setupEventListeners();
    initializeModalForms();
    checkAuthStatus();
});

// Initialize page elements
function initializePage() {
    // Update page title and breadcrumb
    document.title = `${currentCategory} Products - Nature Republic`;
    document.getElementById('categoryTitle').textContent = currentCategory;
    document.getElementById('categoryBreadcrumb').textContent = currentCategory;
    
    // Set category description based on category
    const descriptions = {
        'Skincare': 'Discover our premium skincare collection for radiant, healthy skin',
        'Makeup': 'Explore our vibrant makeup range for every occasion',
        'Haircare': 'Transform your hair with our professional haircare products',
        'Fragrances': 'Find your signature scent with our luxury fragrances',
        'Bath & Body': 'Pamper yourself with our indulgent bath and body products'
    };
    
    const description = descriptions[currentCategory] || 'Discover our amazing collection of products';
    document.getElementById('categoryDescription').textContent = description;
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    document.getElementById('searchInput').addEventListener('input', debounce(applyFilters, 300));
    
    // Price range inputs
    document.getElementById('minPrice').addEventListener('input', debounce(applyFilters, 300));
    document.getElementById('maxPrice').addEventListener('input', debounce(applyFilters, 300));
    
    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Remove active class from all buttons
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            this.classList.add('active');
            
            // Get sort parameters
            const sortField = this.dataset.sort;
            const sortOrder = this.dataset.order;
            currentSort = { field: sortField, order: sortOrder };
            
            // Apply sorting
            applySorting();
        });
    });
    
    // Cart button
    document.getElementById('cartBtn').addEventListener('click', () => {
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
        renderCart();
    });
    
    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
}

// Load products for the current category
async function loadProducts() {
    try {
        showLoading(true);
        
        const response = await fetch(`${API_BASE_URL}/api/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        allProducts = await response.json();
        
        // Debug: Log the raw product data
        console.log('Raw products data:', allProducts);
        if (allProducts.length > 0) {
            console.log('First product structure:', allProducts[0]);
            console.log('Available fields:', Object.keys(allProducts[0]));
        }
        
        // Filter products by category
        // Check if products have category field, if not, try categoryName or other variations
        filteredProducts = allProducts.filter(product => {
            const productCategory = product.category || product.categoryName || product.category_id;
            console.log('Product:', product.name, 'Category field:', productCategory, 'Expected:', currentCategory);
            return productCategory === currentCategory;
        });
        
        // Debug: Log the filtering results
        console.log('All products count:', allProducts.length);
        console.log('Current category:', currentCategory);
        console.log('Filtered products count:', filteredProducts.length);
        console.log('Filtered products:', filteredProducts);
        
        if (filteredProducts.length === 0) {
            showEmptyState();
            return;
        }
        
        // Apply initial sorting and pagination
        applySorting();
        showLoading(false);
        
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
        showLoading(false);
    }
}

// Apply filters (search and price range)
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const minPrice = parseFloat(document.getElementById('minPrice').value) || 0;
    const maxPrice = parseFloat(document.getElementById('maxPrice').value) || Infinity;
    
    filteredProducts = allProducts.filter(product => {
        const productCategory = product.category || product.categoryName || product.category_id;
        if (productCategory !== currentCategory) return false;
        
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.description.toLowerCase().includes(searchTerm);
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        
        return matchesSearch && matchesPrice;
    });
    
    // Reset to first page and apply sorting
    currentPage = 1;
    applySorting();
}

// Apply sorting
function applySorting() {
    filteredProducts.sort((a, b) => {
        let aValue = a[currentSort.field];
        let bValue = b[currentSort.field];
        
        // Handle string values
        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }
        
        if (currentSort.order === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });
    
    renderProducts();
    renderPagination();
}

// Render products grid
function renderProducts() {
    const container = document.getElementById('productsContainer');
    
    if (filteredProducts.length === 0) {
        showEmptyState();
        return;
    }
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const pageProducts = filteredProducts.slice(startIndex, endIndex);
    
    // Generate products HTML
    const productsHTML = pageProducts.map(product => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="product-card card h-100">
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x300/ff69b4/ffffff?text=${encodeURIComponent(product.name)}'">
                </div>
                <div class="product-info">
                    <h5 class="product-title">
                        <a href="product.html?id=${product.id}" class="text-decoration-none text-dark">
                            ${product.name}
                        </a>
                    </h5>
                    <div class="product-rating">
                        ${generateStars(product.rating)}
                        <span class="ms-2 text-muted">(${product.reviewCount || 0})</span>
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
    
    container.innerHTML = productsHTML;
    container.style.display = 'block';
    
    // Debug: Log the rendered HTML and container
    console.log('Products container:', container);
    console.log('Products HTML length:', productsHTML.length);
    console.log('Page products count:', pageProducts.length);
    
    // Update page info
    updatePageInfo();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Previous button
    paginationHTML += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">Previous</a>
        </li>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            paginationHTML += `
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
                </li>
            `;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            paginationHTML += '<li class="page-item disabled"><span class="page-link">...</span></li>';
        }
    }
    
    // Next button
    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">Next</a>
        </li>
    `;
    
    pagination.innerHTML = paginationHTML;
}

// Go to specific page
function goToPage(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
    renderPagination();
    
    // Scroll to top of products section
    document.getElementById('productsContainer').scrollIntoView({ behavior: 'smooth' });
}

// Update page info
function updatePageInfo() {
    const startIndex = (currentPage - 1) * productsPerPage + 1;
    const endIndex = Math.min(currentPage * productsPerPage, filteredProducts.length);
    const total = filteredProducts.length;
    
    document.getElementById('pageInfo').textContent = `Showing ${startIndex}-${endIndex} of ${total} products`;
}

// Show loading state
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productsContainer = document.getElementById('productsContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (show) {
        loadingSpinner.style.display = 'block';
        productsContainer.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
        productsContainer.style.display = 'block';
    }
}

// Show empty state
function showEmptyState() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productsContainer = document.getElementById('productsContainer');
    const emptyState = document.getElementById('emptyState');
    
    loadingSpinner.style.display = 'none';
    productsContainer.style.display = 'none';
    emptyState.style.display = 'block';
}

// Clear all filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('minPrice').value = '';
    document.getElementById('maxPrice').value = '';
    
    // Reset sort to default
    document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[data-sort="name"][data-order="asc"]').classList.add('active');
    currentSort = { field: 'name', order: 'asc' };
    
    // Reload products
    loadProducts();
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

// Cart functions
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
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

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
    showToast('Item removed from cart', 'info');
}

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

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-shopping-cart fa-3x text-muted mb-3"></i>
                <p class="text-muted">Your cart is empty</p>
                <button class="btn btn-pink" data-bs-dismiss="modal">Continue Shopping</button>
            </div>
        `;
        document.getElementById('cartTotal').textContent = 'AED 0.00';
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="d-flex align-items-center mb-3">
            <img src="${item.image}" alt="${item.name}" class="me-3" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;"
                 onerror="this.src='https://via.placeholder.com/60x60/ff69b4/ffffff?text=Product'">
            <div class="flex-grow-1">
                <h6 class="mb-0">${item.name}</h6>
                <p class="text-muted mb-0">AED ${item.price.toFixed(2)}</p>
            </div>
            <div class="d-flex align-items-center">
                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, -1)">-</button>
                <span class="mx-2">${item.quantity}</span>
                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${item.id}, 1)">+</button>
                <button class="btn btn-sm btn-outline-danger ms-2" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cartTotal').textContent = `AED ${total.toFixed(2)}`;
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelector('.cart-count').textContent = count;
}

function saveCart() {
    localStorage.setItem('natureRepublicCart', JSON.stringify(cart));
}

function loadCart() {
    const savedCart = localStorage.getItem('natureRepublicCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Checkout function
async function handleCheckout() {
    if (!currentUser) {
        showToast('Please login to checkout', 'warning');
        const cartModal = bootstrap.Modal.getInstance(document.getElementById('cartModal'));
        cartModal.hide();
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

// Authentication functions
function checkAuthStatus() {
    const user = localStorage.getItem('natureRepublicUser');
    const token = localStorage.getItem('natureRepublicToken');
    
    if (user && token) {
        try {
            currentUser = JSON.parse(user);
            updateNavigationForUser();
        } catch (e) {
            localStorage.removeItem('natureRepublicUser');
            localStorage.removeItem('natureRepublicToken');
        }
    }
}

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

function logout() {
    localStorage.removeItem('natureRepublicUser');
    localStorage.removeItem('natureRepublicToken');
    currentUser = null;
    updateNavigationForUser();
    showToast('Logged out successfully', 'success');
}

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
                const response = await fetch(`${PYTHON_API_URL}/auth/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    localStorage.setItem('natureRepublicUser', JSON.stringify(data.user));
                    localStorage.setItem('natureRepublicToken', data.token);
                    
                    currentUser = data.user;
                    updateNavigationForUser();
                    
                    const loginModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    loginModal.hide();
                    
                    loginForm.reset();
                    showToast(`Welcome back, ${data.user.name}!`, 'success');
                    
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
                const response = await fetch(`${PYTHON_API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ name, email, password })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    
                    localStorage.setItem('natureRepublicUser', JSON.stringify(data.user));
                    localStorage.setItem('natureRepublicToken', data.token);
                    
                    currentUser = data.user;
                    updateNavigationForUser();
                    
                    const registerModal = bootstrap.Modal.getInstance(document.getElementById('loginModal'));
                    registerModal.hide();
                    
                    registerForm.reset();
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

// Toast notification functions
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

function createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

function getToastIcon(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getToastColor(type) {
    const colors = {
        success: 'success',
        error: 'danger',
        warning: 'warning',
        info: 'info'
    };
    return colors[type] || 'info';
}

// Utility functions
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
