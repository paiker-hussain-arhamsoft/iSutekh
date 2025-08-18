const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// Get all categories
router.get('/', async (req, res) => {
    try {
        console.log('GET /categories - Fetching categories...');
        const categories = await allQuery('SELECT * FROM categories ORDER BY displayOrder ASC, name ASC');
        console.log('Categories fetched:', categories);
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories', details: error.message });
    }
});

// Get category by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }
        
        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// Create new category
router.post('/', async (req, res) => {
    try {
        console.log('POST /categories - Request body:', req.body);
        const { name, description, icon } = req.body;

        // Validation
        if (!name) {
            console.log('Validation failed: name is required');
            return res.status(400).json({ error: 'Category name is required' });
        }

        console.log('Creating category:', { name, description, icon });

        // Check if category already exists
        const existingCategory = await getQuery('SELECT * FROM categories WHERE name = ?', [name]);
        if (existingCategory) {
            console.log('Category already exists:', existingCategory);
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        const sql = 'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)';
        const result = await runQuery(sql, [name, description, icon]);
        console.log('Category inserted with ID:', result.id);

        const newCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [result.id]);
        console.log('New category created:', newCategory);
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category', details: error.message });
    }
});

// Update category
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, icon } = req.body;

        // Check if category exists
        const existingCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if new name conflicts with existing category
        if (name && name !== existingCategory.name) {
            const nameConflict = await getQuery('SELECT * FROM categories WHERE name = ? AND id != ?', [name, id]);
            if (nameConflict) {
                return res.status(400).json({ error: 'Category with this name already exists' });
            }
        }

        const sql = 'UPDATE categories SET name = ?, description = ?, icon = ? WHERE id = ?';
        await runQuery(sql, [
            name || existingCategory.name,
            description !== undefined ? description : existingCategory.description,
            icon !== undefined ? icon : existingCategory.icon,
            id
        ]);

        const updatedCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
        res.json(updatedCategory);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// Delete category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if category exists
        const existingCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
        if (!existingCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        // Check if category has products
        const productsInCategory = await allQuery('SELECT COUNT(*) as count FROM products WHERE category = ?', [existingCategory.name]);
        if (productsInCategory[0].count > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete category with existing products. Please reassign or delete the products first.' 
            });
        }

        await runQuery('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ message: 'Category deleted successfully' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

// Get category with product count
router.get('/:id/products', async (req, res) => {
    try {
        const { id } = req.params;
        const category = await getQuery('SELECT * FROM categories WHERE id = ?', [id]);
        
        if (!category) {
            return res.status(404).json({ error: 'Category not found' });
        }

        const products = await allQuery(
            'SELECT * FROM products WHERE category = ? AND status = "active" ORDER BY featured DESC, createdAt DESC',
            [category.name]
        );

        res.json({
            category,
            products,
            productCount: products.length
        });
    } catch (error) {
        console.error('Error fetching category products:', error);
        res.status(500).json({ error: 'Failed to fetch category products' });
    }
});

// Get categories with product counts
router.get('/stats/all', async (req, res) => {
    try {
        const categories = await allQuery('SELECT * FROM categories ORDER BY name ASC');
        
        const categoriesWithStats = await Promise.all(
            categories.map(async (category) => {
                const productCount = await allQuery(
                    'SELECT COUNT(*) as count FROM products WHERE category = ? AND status = "active"',
                    [category.name]
                );
                
                const featuredCount = await allQuery(
                    'SELECT COUNT(*) as count FROM products WHERE category = ? AND featured = 1 AND status = "active"',
                    [category.name]
                );

                const totalValue = await allQuery(
                    'SELECT SUM(price * stock) as total FROM products WHERE category = ? AND status = "active"',
                    [category.name]
                );

                return {
                    ...category,
                    productCount: productCount[0].count,
                    featuredCount: featuredCount[0].count,
                    totalValue: totalValue[0].total || 0
                };
            })
        );

        res.json(categoriesWithStats);
    } catch (error) {
        console.error('Error fetching category stats:', error);
        res.status(500).json({ error: 'Failed to fetch category stats' });
    }
});

// Get category statistics for dashboard
router.get('/stats/dashboard', async (req, res) => {
    try {
        const totalCategories = await allQuery('SELECT COUNT(*) as count FROM categories');
        const totalProducts = await allQuery('SELECT COUNT(*) as count FROM products WHERE status = "active"');
        const totalValue = await allQuery('SELECT SUM(price * stock) as total FROM products WHERE status = "active"');
        
        const topCategories = await allQuery(`
            SELECT c.name, c.description, COUNT(p.id) as productCount, 
                   SUM(p.price * p.stock) as totalValue
            FROM categories c
            LEFT JOIN products p ON c.name = p.category AND p.status = 'active'
            GROUP BY c.id, c.name, c.description
            ORDER BY productCount DESC
            LIMIT 5
        `);

        res.json({
            totalCategories: totalCategories[0].count,
            totalProducts: totalProducts[0].count,
            totalValue: totalValue[0].total || 0,
            topCategories: topCategories
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Update category order
router.put('/order', async (req, res) => {
    try {
        const { categoryIds } = req.body;
        
        if (!Array.isArray(categoryIds)) {
            return res.status(400).json({ error: 'Category IDs array is required' });
        }
        
        // Update the order of categories
        for (let i = 0; i < categoryIds.length; i++) {
            await runQuery('UPDATE categories SET displayOrder = ? WHERE id = ?', [i + 1, categoryIds[i]]);
        }
        
        res.json({ message: 'Category order updated successfully' });
    } catch (error) {
        console.error('Error updating category order:', error);
        res.status(500).json({ error: 'Failed to update category order' });
    }
});

module.exports = router;