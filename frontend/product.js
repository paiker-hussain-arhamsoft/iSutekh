// Product Page JavaScript
let currentProduct = null;
let cart = [];
let currentUser = null;
let allProducts = [];
let relatedProducts = [];

// API endpoints
const API_BASE_URL = 'http://localhost:3000';
const PYTHON_API_URL = 'http://localhost:5000';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Get product ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    console.log('Page loaded, product ID:', productId);
    
    if (!productId) {
        console.log('No product ID provided, using demo product');
        // Use demo product if no ID provided
        currentProduct = createFallbackProduct('demo');
        initializeProductPage();
        loadRelatedProducts();
        showProductContent();
    } else {
        // Load product with ID
        loadProduct(productId);
    }
    
    loadCart();
    setupEventListeners();
    initializeModalForms();
    checkAuthStatus();
});

// Setup event listeners
function setupEventListeners() {
    // Cart button
    document.getElementById('cartBtn').addEventListener('click', () => {
        const cartModal = new bootstrap.Modal(document.getElementById('cartModal'));
        cartModal.show();
        renderCart();
    });
    
    // Checkout button
    document.getElementById('checkoutBtn').addEventListener('click', handleCheckout);
    
    // Quantity input
    document.getElementById('quantityInput').addEventListener('input', function() {
        let value = parseInt(this.value);
        if (isNaN(value) || value < 1) {
            this.value = 1;
        } else if (value > 99) {
            this.value = 99;
        }
    });
}

// Load product details
async function loadProduct(productId) {
    try {
        showLoading(true);
        console.log('Loading product with ID:', productId);
        
        // Load all products to get the current one and related products
        const response = await fetch(`${API_BASE_URL}/api/products`);
        console.log('API response status:', response.status);
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        allProducts = await response.json();
        console.log('Loaded products:', allProducts);
        
        currentProduct = allProducts.find(p => p.id == productId);
        console.log('Found product:', currentProduct);
        
        if (!currentProduct) {
            console.log('Product not found, using fallback data');
            // Use fallback data if product not found
            currentProduct = createFallbackProduct(productId);
        }
        
        // Initialize page with product data
        initializeProductPage();
        loadRelatedProducts();
        showProductContent();
        
    } catch (error) {
        console.error('Error loading product:', error);
        console.log('Using fallback data due to API error');
        
        // Use fallback data if API fails
        currentProduct = createFallbackProduct(productId);
        initializeProductPage();
        loadRelatedProducts();
        showProductContent();
        
        showToast('Using demo data (API unavailable)', 'warning');
    }
}

// Create fallback product data if API fails
function createFallbackProduct(productId) {
    return {
        id: productId,
        name: 'Floral Eau de Parfum',
        price: 299.99,
        description: 'A luxurious floral fragrance that captures the essence of spring gardens. This premium perfume features notes of jasmine, rose, and lily of the valley, creating a sophisticated and long-lasting scent perfect for any occasion.',
        category: 'Fragrances',
        brand: 'Nature Republic',
        rating: 4.8,
        reviewCount: 203,
        image: 'https://via.placeholder.com/600x400/ff69b4/ffffff?text=Perfume+Image'
    };
}

// Initialize product page with data
function initializeProductPage() {
    console.log('Initializing product page with:', currentProduct);
    
    try {
        // Update page title and breadcrumbs
        document.title = `${currentProduct.name} - Nature Republic`;
        document.getElementById('productHeroTitle').textContent = currentProduct.name;
        document.getElementById('productHeroSubtitle').textContent = `Discover ${currentProduct.name}`;
        
        // Update breadcrumbs
        document.getElementById('categoryBreadcrumb').textContent = currentProduct.category;
        document.getElementById('categoryBreadcrumb').href = `category.html?category=${encodeURIComponent(currentProduct.category)}`;
        document.getElementById('productBreadcrumb').textContent = currentProduct.name;
        
        // Update product info
        document.getElementById('productTitle').textContent = currentProduct.name;
        document.getElementById('productPrice').textContent = `AED ${currentProduct.price.toFixed(2)}`;
        document.getElementById('productDescription').textContent = currentProduct.description;
        
        // Update meta information
        document.getElementById('productCategory').textContent = currentProduct.category;
        document.getElementById('productBrand').textContent = currentProduct.brand || 'Nature Republic';
        document.getElementById('productAvailability').textContent = 'In Stock';
        document.getElementById('productRating').textContent = `${currentProduct.rating}/5`;
        
        // Generate star rating
        document.getElementById('productStars').innerHTML = generateStars(currentProduct.rating);
        document.getElementById('reviewCount').textContent = `(${currentProduct.reviewCount || 0} reviews)`;
        
        console.log('Product info elements updated successfully');
        
        // Setup image gallery
        setupImageGallery();
        
        // Load detailed content
        loadDetailedContent();
        
    } catch (error) {
        console.error('Error in initializeProductPage:', error);
        showToast('Error initializing product page', 'error');
    }
}

// Setup image gallery
function setupImageGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    
    // Set main image
    mainImage.src = currentProduct.image;
    mainImage.alt = currentProduct.name;
    mainImage.onerror = function() {
        this.src = `https://via.placeholder.com/600x400/ff69b4/ffffff?text=${encodeURIComponent(currentProduct.name)}`;
    };
    
    // Generate thumbnails (for now, just use the main image multiple times)
    // In a real app, you'd have multiple product images
    const images = [currentProduct.image, currentProduct.image, currentProduct.image, currentProduct.image];
    
    thumbnailGallery.innerHTML = images.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', ${index})">
            <img src="${img}" alt="${currentProduct.name}" 
                 onerror="this.src='https://via.placeholder.com/80x80/ff69b4/ffffff?text=${encodeURIComponent(currentProduct.name)}'">
        </div>
    `).join('');
}

// Change main image
function changeMainImage(imageSrc, index) {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    
    mainImage.src = imageSrc;
    
    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
    });
}

// Load detailed content
function loadDetailedContent() {
    // Detailed description
    document.getElementById('detailedDescription').innerHTML = `
        <p>${currentProduct.description}</p>
        <p>Experience the premium quality and amazing benefits of ${currentProduct.name}. 
        This product is carefully crafted with the finest ingredients to provide you with 
        exceptional results and a luxurious experience.</p>
        <p>Perfect for daily use, ${currentProduct.name} will become an essential part 
        of your beauty routine, helping you achieve the radiant, healthy appearance you deserve.</p>
    `;
    
    // Specifications
    document.getElementById('specificationsList').innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <div class="meta-item">
                    <span class="meta-label">Product Type:</span>
                    <span class="meta-value">${currentProduct.category}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Brand:</span>
                    <span class="meta-value">${currentProduct.brand || 'Nature Republic'}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Rating:</span>
                    <span class="meta-value">${currentProduct.rating}/5</span>
                </div>
            </div>
            <div class="col-md-6">
                <div class="meta-item">
                    <span class="meta-label">Price:</span>
                    <span class="meta-value">AED ${currentProduct.price.toFixed(2)}</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">Availability:</span>
                    <span class="meta-value">In Stock</span>
                </div>
                <div class="meta-item">
                    <span class="meta-label">SKU:</span>
                    <span class="meta-value">${currentProduct.id}</span>
                </div>
            </div>
        </div>
    `;
    
    // Load reviews (mock data for now)
    loadReviews();
}

// Load reviews
function loadReviews() {
    const reviewsList = document.getElementById('reviewsList');
    const noReviews = document.getElementById('noReviews');
    
    // Mock reviews data
    const reviews = [
        {
            id: 1,
            user: 'Sarah M.',
            rating: 5,
            date: '2024-01-15',
            text: 'Absolutely love this product! It exceeded my expectations and I can see visible results after just a week of use.'
        },
        {
            id: 2,
            user: 'Emma L.',
            rating: 4,
            date: '2024-01-10',
            text: 'Great quality product. The texture is perfect and it absorbs well into the skin. Would definitely recommend!'
        }
    ];
    
    if (reviews.length === 0) {
        noReviews.style.display = 'block';
        reviewsList.style.display = 'none';
    } else {
        noReviews.style.display = 'none';
        reviewsList.style.display = 'block';
        
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <div class="reviewer-info">
                        <div class="reviewer-avatar">
                            ${review.user.charAt(0)}
                        </div>
                        <div>
                            <div class="reviewer-name">${review.user}</div>
                            <div class="review-date">${new Date(review.date).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div class="review-rating">
                        ${generateStars(review.rating)}
                    </div>
                </div>
                <div class="review-text">${review.text}</div>
            </div>
        `).join('');
    }
}

// Load related products
function loadRelatedProducts() {
    console.log('Loading related products for category:', currentProduct.category);
    console.log('All products available:', allProducts);
    
    // Get products from the same category, excluding current product
    relatedProducts = allProducts
        .filter(p => p.category === currentProduct.category && p.id !== currentProduct.id)
        .slice(0, 4);
    
    console.log('Filtered related products:', relatedProducts);
    
    if (relatedProducts.length > 0) {
        renderRelatedProducts();
        document.getElementById('relatedProducts').style.display = 'block';
    } else {
        console.log('No related products found, creating demo related products');
        // Create demo related products if none available
        relatedProducts = createDemoRelatedProducts();
        renderRelatedProducts();
        document.getElementById('relatedProducts').style.display = 'block';
    }
}

// Create demo related products
function createDemoRelatedProducts() {
    return [
        {
            id: 'demo1',
            name: 'Rose Garden Mist',
            price: 199.99,
            image: 'https://via.placeholder.com/300x200/ff69b4/ffffff?text=Rose+Mist'
        },
        {
            id: 'demo2',
            name: 'Lavender Dreams',
            price: 249.99,
            image: 'https://via.placeholder.com/300x200/ff69b4/ffffff?text=Lavender'
        },
        {
            id: 'demo3',
            name: 'Vanilla Paradise',
            price: 179.99,
            image: 'https://via.placeholder.com/300x200/ff69b4/ffffff?text=Vanilla'
        },
        {
            id: 'demo4',
            name: 'Ocean Breeze',
            price: 229.99,
            image: 'https://via.placeholder.com/300x200/ff69b4/ffffff?text=Ocean'
        }
    ];
}

// Render related products
function renderRelatedProducts() {
    const grid = document.getElementById('relatedProductsGrid');
    
    grid.innerHTML = relatedProducts.map(product => `
        <div class="col-lg-3 col-md-4 col-sm-6 mb-4">
            <div class="related-product-card">
                <div class="related-product-image">
                    <img src="${product.image}" alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200/ff69b4/ffffff?text=${encodeURIComponent(product.name)}'">
                </div>
                <div class="related-product-info">
                    <h5 class="related-product-title">${product.name}</h5>
                    <div class="related-product-price">AED ${product.price.toFixed(2)}</div>
                    <button class="btn btn-pink btn-sm w-100 mt-2" onclick="viewProduct(${product.id})">
                        View Product
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// View product (navigate to product page)
function viewProduct(productId) {
    window.location.href = `product.html?id=${productId}`;
}

// Update quantity
function updateQuantity(change) {
    const input = document.getElementById('quantityInput');
    let value = parseInt(input.value) + change;
    
    if (value < 1) value = 1;
    if (value > 99) value = 99;
    
    input.value = value;
}

// Add to cart
function addToCart() {
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantityInput').value);
    
    const existingItem = cart.find(item => item.id === currentProduct.id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            id: currentProduct.id,
            name: currentProduct.name,
            price: currentProduct.price,
            image: currentProduct.image,
            quantity: quantity
        });
    }

    saveCart();
    updateCartCount();
    showToast(`${currentProduct.name} added to cart!`, 'success');
}

// Add to wishlist
function addToWishlist() {
    if (!currentProduct) return;
    
    // For now, just show a toast message
    // In a real app, you'd save this to localStorage or send to backend
    showToast(`${currentProduct.name} added to wishlist!`, 'success');
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

// UI state functions
function showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productContent = document.getElementById('productContent');
    const productTabs = document.getElementById('productTabs');
    const errorState = document.getElementById('errorState');
    
    if (show) {
        loadingSpinner.style.display = 'block';
        productContent.style.display = 'none';
        productTabs.style.display = 'none';
        errorState.style.display = 'none';
    } else {
        loadingSpinner.style.display = 'none';
    }
}

function showProductContent() {
    console.log('Showing product content');
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const productContent = document.getElementById('productContent');
    const productTabs = document.getElementById('productTabs');
    
    console.log('Loading spinner:', loadingSpinner);
    console.log('Product content:', productContent);
    console.log('Product tabs:', productTabs);
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (productContent) productContent.style.display = 'block';
    if (productTabs) productTabs.style.display = 'block';
    
    console.log('Product content display style:', productContent ? productContent.style.display : 'element not found');
}

function showError(message) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const errorState = document.getElementById('errorState');
    
    loadingSpinner.style.display = 'none';
    errorState.style.display = 'block';
    
    if (message) {
        errorState.querySelector('h4').textContent = message;
    }
}
