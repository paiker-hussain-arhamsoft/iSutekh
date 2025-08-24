const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const dbPath = path.join(__dirname, '..', 'nature_republic.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        console.error('Database path:', dbPath);
    } else {
        console.log('📦 Connected to SQLite database');
        console.log('Database path:', dbPath);
    }
});

// Initialize database tables
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Create users table
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                avatar TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

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
                displayOrder INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`);

            // Create reviews table
            db.run(`CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                productId INTEGER NOT NULL,
                userId INTEGER NOT NULL,
                userName TEXT NOT NULL,
                userEmail TEXT NOT NULL,
                rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
                title TEXT,
                comment TEXT,
                helpful INTEGER DEFAULT 0,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE,
                FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE
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

            // Insert sample data only if database is empty
            insertSampleDataIfEmpty()
                .then(() => {
                    console.log('✅ Database initialized successfully');
                    resolve();
                })
                .catch(reject);
        });
    });
}

// Insert sample data only if database is empty
function insertSampleDataIfEmpty() {
    return new Promise((resolve, reject) => {
        // Check if data already exists
        db.get("SELECT COUNT(*) as count FROM products", (err, result) => {
            if (err) {
                console.error('Error checking existing data:', err);
                reject(err);
                return;
            }
            
            if (result.count > 0) {
                console.log('✅ Database already contains data, skipping sample data insertion');
                resolve();
                return;
            }
            
            console.log('📝 Database is empty, inserting sample data...');
            
            // Sample categories
            const categories = [
                { name: 'Skincare', description: 'Nourish your skin with premium products', icon: 'fas fa-magic', displayOrder: 1 },
                { name: 'Makeup', description: 'Enhance your natural beauty', icon: 'fas fa-palette', displayOrder: 2 },
                { name: 'Haircare', description: 'Beautiful hair starts with great care', icon: 'fas fa-cut', displayOrder: 3 },
                { name: 'Fragrances', description: 'Signature scents for every occasion', icon: 'fas fa-spray-can', displayOrder: 4 }
            ];

            // Sample products - Only 8 products with detailed, researched information
            const products = [
                {
                    name: 'Hydrating Face Serum',
                    description: 'A lightweight, fast-absorbing serum that delivers intense hydration and helps improve skin texture and tone. Formulated with hyaluronic acid, vitamin B5, and niacinamide for optimal skin health.',
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
                    description: 'Long-lasting, non-drying liquid lipstick with a velvety matte finish. Available in 12 stunning shades. Features a comfortable, lightweight formula that stays put for up to 8 hours.',
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
                    description: 'Deep conditioning treatment that repairs damaged hair and restores shine and softness. Enriched with argan oil, shea butter, and keratin proteins for intensive repair and hydration.',
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
                    description: 'A delicate blend of jasmine, rose, and vanilla that creates a romantic and feminine fragrance. Long-lasting scent with top notes of bergamot, heart notes of jasmine and rose, and base notes of vanilla and musk.',
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
                    description: 'Brightening face cream with Vitamin C that helps reduce dark spots and evens skin tone. Contains 15% Vitamin C, ferulic acid, and vitamin E for antioxidant protection and brightening results.',
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
                    description: 'Professional 18-color eyeshadow palette with matte and shimmer finishes for endless looks. Highly pigmented, blendable formula with both neutral and bold color options for day and night makeup.',
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
                    description: 'Gentle, sulfate-free shampoo that cleanses without stripping natural oils from your hair. Formulated with coconut oil, aloe vera, and natural extracts for gentle cleansing and moisture retention.',
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
                    description: 'Refreshing citrus-based cologne perfect for everyday wear with notes of lemon, bergamot, and cedar. Light, invigorating scent that\'s perfect for casual and professional settings.',
                    price: 65.99,
                    stock: 35,
                    category: 'Fragrances',
                    image: 'https://images.unsplash.com/photo-1592945403244-b3faa5b61354?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
                    featured: 0,
                    rating: 4.1,
                    reviewCount: 73
                }
            ];

            // Sample users
            const users = [
                {
                    name: 'Sarah Johnson',
                    email: 'sarah@example.com',
                    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
                    avatar: null
                },
                {
                    name: 'Emily Davis',
                    email: 'emily@example.com',
                    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
                    avatar: null
                },
                {
                    name: 'Michael Chen',
                    email: 'michael@example.com',
                    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
                    avatar: null
                },
                {
                    name: 'Lisa Rodriguez',
                    email: 'lisa@example.com',
                    password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
                    avatar: null
                }
            ];

            // Sample reviews
            const reviews = [
                {
                    productId: 1,
                    userId: 1,
                    userName: 'Sarah Johnson',
                    userEmail: 'sarah@example.com',
                    rating: 5,
                    title: 'Amazing hydration!',
                    comment: 'This serum is incredible! My skin feels so hydrated and plump. I use it morning and night and have noticed a significant improvement in my skin texture.'
                },
                {
                    productId: 1,
                    userId: 2,
                    userName: 'Emily Davis',
                    userEmail: 'emily@example.com',
                    rating: 4,
                    title: 'Great product, fast absorption',
                    comment: 'Really like how quickly this absorbs into the skin. Leaves no sticky residue and my makeup applies smoothly over it.'
                },
                {
                    productId: 2,
                    userId: 3,
                    userName: 'Michael Chen',
                    userEmail: 'michael@example.com',
                    rating: 5,
                    title: 'Perfect matte finish',
                    comment: 'This lipstick stays on all day! The color is vibrant and the matte finish is exactly what I was looking for.'
                },
                {
                    productId: 3,
                    userId: 4,
                    userName: 'Lisa Rodriguez',
                    userEmail: 'lisa@example.com',
                    rating: 4,
                    title: 'Nourishing and effective',
                    comment: 'My hair feels so much softer after using this mask. I leave it on for 20 minutes and the results are amazing.'
                }
            ];

            // Insert categories
            console.log('Inserting sample categories...');
            const categoryStmt = db.prepare('INSERT INTO categories (name, description, icon, displayOrder) VALUES (?, ?, ?, ?)');
            categories.forEach(category => {
                console.log('Inserting category:', category.name);
                categoryStmt.run(category.name, category.description, category.icon, category.displayOrder);
            });
            categoryStmt.finalize();
            console.log('Sample categories inserted');

            // Insert products
            console.log('Inserting sample products...');
            const productStmt = db.prepare(`INSERT INTO products 
                (name, description, price, stock, category, image, featured, rating, reviewCount) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
            
            products.forEach(product => {
                console.log('Inserting product:', product.name);
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
            console.log('Sample products inserted');

            // Insert users
            console.log('Inserting sample users...');
            const userStmt = db.prepare('INSERT INTO users (name, email, password, avatar) VALUES (?, ?, ?, ?)');
            users.forEach(user => {
                console.log('Inserting user:', user.name);
                userStmt.run(user.name, user.email, user.password, user.avatar);
            });
            userStmt.finalize();
            console.log('Sample users inserted');

            // Insert reviews
            console.log('Inserting sample reviews...');
            const reviewStmt = db.prepare(`INSERT INTO reviews 
                (productId, userId, userName, userEmail, rating, title, comment) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`);
            
            reviews.forEach(review => {
                console.log('Inserting review for product:', review.productId);
                reviewStmt.run(
                    review.productId,
                    review.userId,
                    review.userName,
                    review.userEmail,
                    review.rating,
                    review.title,
                    review.comment
                );
            });
            reviewStmt.finalize();
            console.log('Sample reviews inserted');

            console.log('✅ All sample data inserted successfully');
            resolve();
        });
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