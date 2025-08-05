const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', '..', 'database', 'beauty_bliss.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('📦 Connected to SQLite database');
    }
});

// Initialize database tables
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create products table
            db.run(`CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT,
                price REAL NOT NULL,
                stock INTEGER DEFAULT 0,
                category TEXT,
                image TEXT,
                status TEXT DEFAULT 'active',
                featured BOOLEAN DEFAULT 0,
                rating REAL DEFAULT 0,
                reviewCount INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create categories table
            db.run(`CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT,
                icon TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create orders table
            db.run(`CREATE TABLE IF NOT EXISTS orders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customerId INTEGER,
                customerName TEXT,
                customerEmail TEXT,
                items TEXT NOT NULL,
                total REAL NOT NULL,
                status TEXT DEFAULT 'pending',
                shippingAddress TEXT,
                paymentMethod TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Insert sample data
            insertSampleData()
                .then(() => {
                    console.log('✅ Database initialized with sample data');
                    resolve();
                })
                .catch(reject);
        });
    });
}

// Insert sample data
function insertSampleData() {
    return new Promise((resolve, reject) => {
        // Sample categories
        const categories = [
            { name: 'Skincare', description: 'Nourish your skin with premium products', icon: 'fas fa-magic' },
            { name: 'Makeup', description: 'Enhance your natural beauty', icon: 'fas fa-palette' },
            { name: 'Haircare', description: 'Beautiful hair starts with great care', icon: 'fas fa-cut' },
            { name: 'Fragrances', description: 'Signature scents for every occasion', icon: 'fas fa-spray-can' }
        ];

        // Sample products
        const products = [
            {
                name: 'Hydrating Face Serum',
                description: 'A lightweight, fast-absorbing serum that delivers intense hydration and helps improve skin texture and tone.',
                price: 45.99,
                stock: 50,
                category: 'Skincare',
                image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 1,
                rating: 4.5,
                reviewCount: 128
            },
            {
                name: 'Matte Liquid Lipstick',
                description: 'Long-lasting, non-drying liquid lipstick with a velvety matte finish. Available in 12 stunning shades.',
                price: 24.99,
                stock: 75,
                category: 'Makeup',
                image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 1,
                rating: 4.3,
                reviewCount: 89
            },
            {
                name: 'Nourishing Hair Mask',
                description: 'Deep conditioning treatment that repairs damaged hair and restores shine and softness.',
                price: 32.50,
                stock: 30,
                category: 'Haircare',
                image: 'https://images.unsplash.com/photo-1522338140263-f46f5913618a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 1,
                rating: 4.7,
                reviewCount: 156
            },
            {
                name: 'Floral Eau de Parfum',
                description: 'A delicate blend of jasmine, rose, and vanilla that creates a romantic and feminine fragrance.',
                price: 89.99,
                stock: 25,
                category: 'Fragrances',
                image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 1,
                rating: 4.8,
                reviewCount: 203
            },
            {
                name: 'Vitamin C Brightening Cream',
                description: 'Brightening face cream with Vitamin C that helps reduce dark spots and evens skin tone.',
                price: 38.99,
                stock: 40,
                category: 'Skincare',
                image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 0,
                rating: 4.2,
                reviewCount: 67
            },
            {
                name: 'Eyeshadow Palette',
                description: 'Professional 18-color eyeshadow palette with matte and shimmer finishes for endless looks.',
                price: 55.00,
                stock: 60,
                category: 'Makeup',
                image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 0,
                rating: 4.6,
                reviewCount: 142
            },
            {
                name: 'Sulfate-Free Shampoo',
                description: 'Gentle, sulfate-free shampoo that cleanses without stripping natural oils from your hair.',
                price: 28.99,
                stock: 45,
                category: 'Haircare',
                image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 0,
                rating: 4.4,
                reviewCount: 98
            },
            {
                name: 'Citrus Fresh Cologne',
                description: 'Refreshing citrus-based cologne perfect for everyday wear with notes of lemon, bergamot, and cedar.',
                price: 65.99,
                stock: 35,
                category: 'Fragrances',
                image: 'https://images.unsplash.com/photo-1592945403244-b3faa5b61354?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                featured: 0,
                rating: 4.1,
                reviewCount: 73
            }
        ];

        // Insert categories
        const categoryStmt = db.prepare('INSERT OR IGNORE INTO categories (name, description, icon) VALUES (?, ?, ?)');
        categories.forEach(category => {
            categoryStmt.run(category.name, category.description, category.icon);
        });
        categoryStmt.finalize();

        // Insert products
        const productStmt = db.prepare(`INSERT OR IGNORE INTO products 
            (name, description, price, stock, category, image, featured, rating, reviewCount) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        
        products.forEach(product => {
            productStmt.run(
                product.name,
                product.description,
                product.price,
                product.stock,
                product.category,
                product.image,
                product.featured,
                product.rating,
                product.reviewCount
            );
        });
        productStmt.finalize();

        // Sample orders
        const orders = [
            {
                customerName: 'Sarah Johnson',
                customerEmail: 'sarah@example.com',
                items: JSON.stringify([
                    { id: 1, name: 'Hydrating Face Serum', price: 45.99, quantity: 1 },
                    { id: 3, name: 'Nourishing Hair Mask', price: 32.50, quantity: 2 }
                ]),
                total: 110.99,
                status: 'delivered'
            },
            {
                customerName: 'Emily Davis',
                customerEmail: 'emily@example.com',
                items: JSON.stringify([
                    { id: 2, name: 'Matte Liquid Lipstick', price: 24.99, quantity: 1 },
                    { id: 6, name: 'Eyeshadow Palette', price: 55.00, quantity: 1 }
                ]),
                total: 79.99,
                status: 'processing'
            }
        ];

        // Insert orders
        const orderStmt = db.prepare(`INSERT OR IGNORE INTO orders 
            (customerName, customerEmail, items, total, status) 
            VALUES (?, ?, ?, ?, ?)`);
        
        orders.forEach(order => {
            orderStmt.run(
                order.customerName,
                order.customerEmail,
                order.items,
                order.total,
                order.status
            );
        });
        orderStmt.finalize();

        resolve();
    });
}

// Helper functions for database operations
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve({ id: this.lastID, changes: this.changes });
            }
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    db,
    initializeDatabase,
    runQuery,
    getQuery,
    allQuery
};