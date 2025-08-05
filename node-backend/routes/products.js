const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// Get all products
router.get('/', async (req, res) => {
    try {
        const { category, featured, search } = req.query;
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];

        if (category) {
            sql += ' AND category = ?';
            params.push(category);
        }

        if (featured === 'true') {
            sql += ' AND featured = 1';
        }

        if (search) {
            sql += ' AND (name LIKE ? OR description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        sql += ' ORDER BY createdAt DESC';

        const products = await allQuery(sql, params);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product
router.post('/', async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            stock,
            category,
            image,
            status = 'active',
            featured = false,
            rating = 0,
            reviewCount = 0
        } = req.body;

        // Validation
        if (!name || !price || !category) {
            return res.status(400).json({ error: 'Name, price, and category are required' });
        }

        const sql = `
            INSERT INTO products (name, description, price, stock, category, image, status, featured, rating, reviewCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            name, description, price, stock, category, image, status, featured ? 1 : 0, rating, reviewCount
        ]);

        const newProduct = await getQuery('SELECT * FROM products WHERE id = ?', [result.id]);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            description,
            price,
            stock,
            category,
            image,
            status,
            featured,
            rating,
            reviewCount
        } = req.body;

        // Check if product exists
        const existingProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const sql = `
            UPDATE products 
            SET name = ?, description = ?, price = ?, stock = ?, category = ?, 
                image = ?, status = ?, featured = ?, rating = ?, reviewCount = ?,
                updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await runQuery(sql, [
            name || existingProduct.name,
            description || existingProduct.description,
            price || existingProduct.price,
            stock !== undefined ? stock : existingProduct.stock,
            category || existingProduct.category,
            image || existingProduct.image,
            status || existingProduct.status,
            featured !== undefined ? (featured ? 1 : 0) : existingProduct.featured,
            rating !== undefined ? rating : existingProduct.rating,
            reviewCount !== undefined ? reviewCount : existingProduct.reviewCount,
            id
        ]);

        const updatedProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const existingProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await runQuery('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// Get products by category
router.get('/category/:category', async (req, res) => {
    try {
        const { category } = req.params;
        const products = await allQuery(
            'SELECT * FROM products WHERE category = ? AND status = "active" ORDER BY featured DESC, createdAt DESC',
            [category]
        );
        res.json(products);
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({ error: 'Failed to fetch products by category' });
    }
});

// Get featured products
router.get('/featured/all', async (req, res) => {
    try {
        const products = await allQuery(
            'SELECT * FROM products WHERE featured = 1 AND status = "active" ORDER BY rating DESC, createdAt DESC'
        );
        res.json(products);
    } catch (error) {
        console.error('Error fetching featured products:', error);
        res.status(500).json({ error: 'Failed to fetch featured products' });
    }
});

// Update product stock
router.patch('/:id/stock', async (req, res) => {
    try {
        const { id } = req.params;
        const { stock } = req.body;

        if (stock === undefined || stock < 0) {
            return res.status(400).json({ error: 'Valid stock quantity is required' });
        }

        const existingProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await runQuery(
            'UPDATE products SET stock = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [stock, id]
        );

        const updatedProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product stock:', error);
        res.status(500).json({ error: 'Failed to update product stock' });
    }
});

// Update product rating
router.patch('/:id/rating', async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, reviewCount } = req.body;

        if (rating === undefined || rating < 0 || rating > 5) {
            return res.status(400).json({ error: 'Valid rating (0-5) is required' });
        }

        const existingProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        if (!existingProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const newReviewCount = reviewCount || existingProduct.reviewCount + 1;

        await runQuery(
            'UPDATE products SET rating = ?, reviewCount = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [rating, newReviewCount, id]
        );

        const updatedProduct = await getQuery('SELECT * FROM products WHERE id = ?', [id]);
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product rating:', error);
        res.status(500).json({ error: 'Failed to update product rating' });
    }
});

module.exports = router;