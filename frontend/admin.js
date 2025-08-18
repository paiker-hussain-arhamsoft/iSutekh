// Admin Panel JavaScript
let products = [];
let categories = [];
let orders = [];
let users = [];
let currentSection = 'dashboard';
let itemToDelete = null;

// API endpoints
const API_BASE_URL = 'http://localhost:3000';
const PYTHON_API_URL = 'http://localhost:5000';

// Initialize admin panel
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin panel initializing...');
    
    // Check if user is authenticated
    if (!checkAuth()) {
        window.location.href = 'admin-login.html';
        return;
    }
    
    setupNavigation();
    loadDashboardData();
    loadProducts();
    loadCategories();
    loadOrders();
    loadUsers();
    setupEventListeners();
    
    // For testing: show categories section after a delay
    setTimeout(() => {
        console.log('Testing: switching to categories section');
        showSection('categories');
        
        // Test categories loading again
        console.log('Testing: reloading categories');
        loadCategories();
    }, 2000);
});

// Check authentication
function checkAuth() {
    const user = localStorage.getItem('natureRepublicUser');
    const token = localStorage.getItem('natureRepublicToken');
    
    if (!user || !token) {
        return false;
    }
    
    try {
        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

// Get auth headers for API requests
function getAuthHeaders() {
    const token = localStorage.getItem('natureRepublicToken');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Setup navigation
function setupNavigation() {
    const navLinks = document.querySelectorAll('[data-section]');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });
}

// Show section
function showSection(sectionName) {
    console.log('Showing section:', sectionName);
    
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Section', sectionName, 'is now active');
    } else {
        console.error('Section', sectionName, 'not found!');
    }
    
    // Add active class to clicked nav link
    document.querySelectorAll(`[data-section="${sectionName}"]`).forEach(link => {
        link.classList.add('active');
    });
    
    currentSection = sectionName;
}

// Setup event listeners
function setupEventListeners() {
    // Product search and filters
    document.getElementById('productSearch').addEventListener('input', filterProducts);
    document.getElementById('categoryFilter').addEventListener('change', filterProducts);
    document.getElementById('statusFilter').addEventListener('change', filterProducts);
}

// Load dashboard data
async function loadDashboardData() {
    try {
        // Load stats
        const statsResponse = await fetch(`${API_BASE_URL}/api/stats`);
        const stats = await statsResponse.json();
        
        document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
        document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalRevenue').textContent = `AED ${(stats.totalRevenue || 0).toFixed(2)}`;
        
        // Load recent orders
        loadRecentOrders();
        
        // Load top products
        loadTopProducts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Error loading dashboard data', 'error');
    }
}

// Load products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/products`);
        products = await response.json();
        renderProductsTable();
        // populateCategoryFilter will be called after categories are loaded
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
    }
}

// Render products table
function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-box-open"></i>
                        <p>No products found</p>
                        <button class="btn btn-pink" onclick="openAddProductModal()">Add First Product</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = products.map(product => `
        <tr>
            <td>
                <img src="${product.image}" alt="${product.name}" class="product-image-small" 
                     onerror="this.src='https://via.placeholder.com/50x50/ff69b4/ffffff?text=Product'">
            </td>
            <td>
                <strong>${product.name}</strong>
                <br><small class="text-muted">${product.description.substring(0, 50)}...</small>
            </td>
            <td>
                <span class="badge bg-light text-dark">${product.category}</span>
            </td>
            <td><strong>AED ${product.price.toFixed(2)}</strong></td>
            <td>
                <span class="badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}">
                    ${product.stock}
                </span>
            </td>
            <td>
                <span class="badge ${product.status === 'active' ? 'badge-active' : 'badge-inactive'}">
                    ${product.status}
                </span>
            </td>
            <td>
                <button class="btn btn-action btn-view" onclick="viewProduct(${product.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-edit" onclick="editProduct(${product.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-action btn-delete" onclick="deleteProduct(${product.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Filter products
function filterProducts() {
    const searchTerm = document.getElementById('productSearch').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                            product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || product.category === categoryFilter;
        const matchesStatus = !statusFilter || product.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    renderFilteredProducts(filteredProducts);
}

// Render filtered products
function renderFilteredProducts(filteredProducts) {
    const tbody = document.getElementById('productsTableBody');
    
    if (filteredProducts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-search"></i>
                        <p>No products match your filters</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filteredProducts.map(product => `
        <tr>
            <td>
                <img src="${product.image}" alt="${product.name}" class="product-image-small" 
                     onerror="this.src='https://via.placeholder.com/50x50/ff69b4/ffffff?text=Product'">
            </td>
            <td>
                <strong>${product.name}</strong>
                <br><small class="text-muted">${product.description.substring(0, 50)}...</small>
            </td>
            <td>
                <span class="badge bg-light text-dark">${product.category}</span>
            </td>
            <td><strong>AED ${product.price.toFixed(2)}</strong></td>
            <td>
                <span class="badge ${product.stock > 10 ? 'bg-success' : product.stock > 0 ? 'bg-warning' : 'bg-danger'}">
                    ${product.stock}
                </span>
            </td>
            <td>
                <span class="badge ${product.status === 'active' ? 'badge-active' : 'badge-inactive'}">
                    ${product.status}
                </span>
            </td>
            <td>
                <button class="btn btn-action btn-view" onclick="viewProduct(${product.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-edit" onclick="editProduct(${product.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-action btn-delete" onclick="deleteProduct(${product.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Populate category filter
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    const productCategory = document.getElementById('productCategory');
    
    // Use categories from backend instead of extracting from products
    const categoryOptions = categories.map(category => 
        `<option value="${category.name}">${category.name}</option>`
    ).join('');
    
    categoryFilter.innerHTML = '<option value="">All Categories</option>' + categoryOptions;
    productCategory.innerHTML = '<option value="">Select Category</option>' + categoryOptions;
}

// Open add product modal
function openAddProductModal() {
    document.getElementById('productModalTitle').textContent = 'Add New Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// Edit product
function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    document.getElementById('productImage').value = product.image;
    document.getElementById('productStatus').value = product.status;
    document.getElementById('productFeatured').checked = product.featured;
    document.getElementById('productRating').value = product.rating || 0;
    document.getElementById('productDescription').value = product.description;
    
    const modal = new bootstrap.Modal(document.getElementById('productModal'));
    modal.show();
}

// View product
function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Create a simple view modal
    const viewModal = `
        <div class="modal fade" id="viewProductModal" tabindex="-1">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Product Details</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                <img src="${product.image}" alt="${product.name}" class="img-fluid rounded" 
                                     onerror="this.src='https://via.placeholder.com/300x300/ff69b4/ffffff?text=Product'">
                            </div>
                            <div class="col-md-8">
                                <h4>${product.name}</h4>
                                <p class="text-muted">${product.description}</p>
                                <div class="row">
                                    <div class="col-6">
                                        <strong>Price:</strong> AED ${product.price.toFixed(2)}
                                    </div>
                                    <div class="col-6">
                                        <strong>Stock:</strong> ${product.stock}
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col-6">
                                        <strong>Category:</strong> ${product.category}
                                    </div>
                                    <div class="col-6">
                                        <strong>Status:</strong> 
                                        <span class="badge ${product.status === 'active' ? 'badge-active' : 'badge-inactive'}">
                                            ${product.status}
                                        </span>
                                    </div>
                                </div>
                                <div class="row mt-2">
                                    <div class="col-6">
                                        <strong>Featured:</strong> ${product.featured ? 'Yes' : 'No'}
                                    </div>
                                    <div class="col-6">
                                        <strong>Rating:</strong> ${product.rating || 0}/5
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                        <button type="button" class="btn btn-pink" onclick="editProduct(${product.id})">Edit Product</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('viewProductModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', viewModal);
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('viewProductModal'));
    modal.show();
    
    // Clean up modal after it's hidden
    document.getElementById('viewProductModal').addEventListener('hidden.bs.modal', function() {
        this.remove();
    });
}

// Save product
async function saveProduct() {
    const form = document.getElementById('productForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const productData = {
        name: document.getElementById('productName').value,
        category: document.getElementById('productCategory').value,
        price: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        image: document.getElementById('productImage').value,
        status: document.getElementById('productStatus').value,
        featured: document.getElementById('productFeatured').checked,
        rating: parseFloat(document.getElementById('productRating').value),
        description: document.getElementById('productDescription').value
    };
    
    const productId = document.getElementById('productId').value;
    const isEdit = productId !== '';
    
    try {
        const url = isEdit ? `${API_BASE_URL}/api/products/${productId}` : `${API_BASE_URL}/api/products`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData)
        });
        
        if (response.ok) {
            showToast(`Product ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            loadProducts();
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('productModal'));
            modal.hide();
        } else {
            const error = await response.json();
            showToast(error.message || 'Error saving product', 'error');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        showToast('Error saving product', 'error');
    }
}

// Delete product
function deleteProduct(productId) {
    itemToDelete = { type: 'product', id: productId };
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Confirm delete
async function confirmDelete() {
    if (!itemToDelete) return;
    
    try {
        let response;
        if (itemToDelete.type === 'category') {
            response = await fetch(`${API_BASE_URL}/api/categories/${itemToDelete.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Category deleted successfully!', 'success');
                loadCategories();
                
                // Refresh the main frontend categories if it's open in another tab
                if (window.opener && !window.opener.closed) {
                    try {
                        window.opener.postMessage({ type: 'refreshCategories' }, '*');
                    } catch (e) {
                        // Ignore if main window is not accessible
                    }
                }
            } else {
                const error = await response.json();
                showToast(error.error || 'Error deleting category', 'error');
            }
        } else {
            response = await fetch(`${API_BASE_URL}/api/products/${itemToDelete.id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Product deleted successfully!', 'success');
                loadProducts();
            } else {
                showToast('Error deleting product', 'error');
            }
        }
    } catch (error) {
        console.error('Error deleting item:', error);
        showToast('Error deleting item', 'error');
    }
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
    modal.hide();
    itemToDelete = null;
}

// Load categories
async function loadCategories() {
    try {
        console.log('Loading categories...');
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        console.log('Categories response:', response);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        categories = await response.json();
        console.log('Categories loaded:', categories);
        
        renderCategoriesGrid();
        // Populate category filters after categories are loaded
        populateCategoryFilter();
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Error loading categories', 'error');
    }
}

// Render categories grid
function renderCategoriesGrid() {
    console.log('Rendering categories grid...');
    const grid = document.getElementById('categoriesGrid');
    console.log('Grid element:', grid);
    console.log('Categories to render:', categories);
    
    if (!grid) {
        console.error('Categories grid element not found!');
        return;
    }
    
    if (categories.length === 0) {
        console.log('No categories to display, showing empty state');
        grid.innerHTML = `
            <div class="col-12">
                <div class="empty-state">
                    <i class="fas fa-tags"></i>
                    <p>No categories found</p>
                    <button class="btn btn-pink" onclick="openAddCategoryModal()">Add First Category</button>
                </div>
            </div>
        `;
        return;
    }
    
    console.log('Rendering', categories.length, 'categories');
    const categoriesHTML = categories.map(category => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="category-card">
                <div class="category-icon">
                    <i class="${category.icon || 'fas fa-tag'}"></i>
                </div>
                <h5>${category.name}</h5>
                <p class="text-muted">${category.description || 'No description'}</p>
                <div class="mt-3">
                    <button class="btn btn-sm btn-outline-pink me-2" onclick="editCategory(${category.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteCategory(${category.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    console.log('Categories HTML:', categoriesHTML);
    grid.innerHTML = categoriesHTML;
    console.log('Categories grid rendered');
}

// Open add category modal
function openAddCategoryModal() {
    document.getElementById('categoryModalTitle').textContent = 'Add New Category';
    document.getElementById('categoryForm').reset();
    document.getElementById('categoryId').value = '';
    
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
}

// Edit category
function editCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    document.getElementById('categoryModalTitle').textContent = 'Edit Category';
    document.getElementById('categoryId').value = category.id;
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryIcon').value = category.icon || '';
    
    const modal = new bootstrap.Modal(document.getElementById('categoryModal'));
    modal.show();
}

// Save category
async function saveCategory() {
    const form = document.getElementById('categoryForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const categoryData = {
        name: document.getElementById('categoryName').value,
        description: document.getElementById('categoryDescription').value,
        icon: document.getElementById('categoryIcon').value
    };
    
    const categoryId = document.getElementById('categoryId').value;
    const isEdit = categoryId !== '';
    
    try {
        const url = isEdit ? `${API_BASE_URL}/api/categories/${categoryId}` : `${API_BASE_URL}/api/categories`;
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(categoryData)
        });
        
        if (response.ok) {
            const result = await response.json();
            
            // If editing and category name changed, update products
            if (isEdit) {
                const oldCategory = categories.find(c => c.id === categoryId);
                if (oldCategory && oldCategory.name !== categoryData.name) {
                    await updateProductCategories(oldCategory.name, categoryData.name);
                }
            }
            
            showToast(`Category ${isEdit ? 'updated' : 'created'} successfully!`, 'success');
            loadCategories();
            
            // Refresh the main frontend categories if it's open in another tab
            if (window.opener && !window.opener.closed) {
                try {
                    window.opener.postMessage({ type: 'refreshCategories' }, '*');
                } catch (e) {
                    // Ignore if main window is not accessible
                }
            }
            
            const modal = bootstrap.Modal.getInstance(document.getElementById('categoryModal'));
            modal.hide();
        } else {
            const error = await response.json();
            showToast(error.error || 'Error saving category', 'error');
        }
    } catch (error) {
        console.error('Error saving category:', error);
        showToast('Error saving category', 'error');
    }
}

// Delete category
function deleteCategory(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;
    
    // Check if category has products
    const productsInCategory = products.filter(p => p.category === category.name);
    
    if (productsInCategory.length > 0) {
        showToast(`Cannot delete category "${category.name}" - it has ${productsInCategory.length} product(s). Please reassign or delete the products first.`, 'error');
        return;
    }
    
    itemToDelete = { type: 'category', id: categoryId };
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

// Bulk update product categories (when a category is renamed)
async function updateProductCategories(oldCategoryName, newCategoryName) {
    try {
        const productsToUpdate = products.filter(p => p.category === oldCategoryName);
        
        if (productsToUpdate.length === 0) return;
        
        // Update each product's category
        for (const product of productsToUpdate) {
            const response = await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...product,
                    category: newCategoryName
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to update product ${product.name}`);
            }
        }
        
        showToast(`Updated ${productsToUpdate.length} product(s) to new category "${newCategoryName}"`, 'success');
        loadProducts(); // Refresh products list
    } catch (error) {
        console.error('Error updating product categories:', error);
        showToast('Error updating product categories', 'error');
    }
}

// Load orders
async function loadOrders() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/orders`);
        orders = await response.json();
        renderOrdersTable();
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error loading orders', 'error');
    }
}

// Render orders table
function renderOrdersTable() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (orders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-shopping-bag"></i>
                        <p>No orders found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td><strong>#${order.id}</strong></td>
            <td>${order.customerName || 'Guest'}</td>
            <td>${order.items.length} items</td>
            <td><strong>AED ${order.total.toFixed(2)}</strong></td>
            <td>
                <span class="badge ${getOrderStatusBadge(order.status)}">
                    ${order.status}
                </span>
            </td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-action btn-view" onclick="viewOrder(${order.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-edit" onclick="updateOrderStatus(${order.id})" title="Update Status">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Get order status badge
function getOrderStatusBadge(status) {
    switch (status) {
        case 'pending': return 'badge-pending';
        case 'processing': return 'badge-warning';
        case 'shipped': return 'badge-info';
        case 'delivered': return 'badge-completed';
        case 'cancelled': return 'badge-inactive';
        default: return 'badge-pending';
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch(`${PYTHON_API_URL}/users`, {
            headers: getAuthHeaders()
        });
        
        if (response.status === 401) {
            // Token expired or invalid
                    localStorage.removeItem('natureRepublicUser');
        localStorage.removeItem('natureRepublicToken');
            window.location.href = 'admin-login.html';
            return;
        }
        
        if (response.ok) {
            const data = await response.json();
            users = data.users || [];
            renderUsersTable();
        } else {
            const error = await response.json();
            showToast(error.error || 'Error loading users', 'error');
        }
    } catch (error) {
        console.error('Error loading users:', error);
        showToast('Error loading users', 'error');
    }
}

// Render users table
function renderUsersTable() {
    const tbody = document.getElementById('usersTableBody');
    
    if (users.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <p>No users found</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <span class="badge ${user.role === 'admin' ? 'badge-active' : 'badge-inactive'}">
                    ${user.role}
                </span>
            </td>
            <td>
                <span class="badge ${user.status === 'active' ? 'badge-active' : 'badge-inactive'}">
                    ${user.status}
                </span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
                <button class="btn btn-action btn-view" onclick="viewUser(${user.id})" title="View">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-action btn-edit" onclick="editUser(${user.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Load recent orders for dashboard
async function loadRecentOrders() {
    try {
        const recentOrders = orders.slice(0, 5);
        const container = document.getElementById('recentOrders');
        
        if (recentOrders.length === 0) {
            container.innerHTML = '<p class="text-muted">No recent orders</p>';
            return;
        }
        
        container.innerHTML = recentOrders.map(order => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <strong>Order #${order.id}</strong>
                    <br><small class="text-muted">${order.customerName || 'Guest'}</small>
                </div>
                <div class="text-end">
                    <strong>AED ${order.total.toFixed(2)}</strong>
                    <br><small class="badge ${getOrderStatusBadge(order.status)}">${order.status}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

// Load top products for dashboard
async function loadTopProducts() {
    try {
        const topProducts = products.filter(p => p.featured).slice(0, 5);
        const container = document.getElementById('topProducts');
        
        if (topProducts.length === 0) {
            container.innerHTML = '<p class="text-muted">No featured products</p>';
            return;
        }
        
        container.innerHTML = topProducts.map(product => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <div>
                    <strong>${product.name}</strong>
                    <br><small class="text-muted">${product.category}</small>
                </div>
                <div class="text-end">
                    <strong>$${product.price.toFixed(2)}</strong>
                    <br><small class="text-muted">Stock: ${product.stock}</small>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading top products:', error);
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toastContainer = document.querySelector('.toast-container') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast show`;
    toast.innerHTML = `
                 <div class="toast-header">
             <i class="fas fa-${getToastIcon(type)} text-${getToastColor(type)} me-2"></i>
             <strong class="me-auto">Nature Republic Admin</strong>
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

// Logout function
function logout() {
    localStorage.removeItem('natureRepublicUser');
    localStorage.removeItem('natureRepublicToken');
    window.location.href = 'admin-login.html';
}