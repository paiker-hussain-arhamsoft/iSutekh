const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const categories = await allQuery('SELECT * FROM categories ORDER BY name ASC');
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
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
        const { name, description, icon } = req.body;

        // Validation
        if (!name) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        // Check if category already exists
        const existingCategory = await getQuery('SELECT * FROM categories WHERE name = ?', [name]);
        if (existingCategory) {
            return res.status(400).json({ error: 'Category with this name already exists' });
        }

        const sql = 'INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)';
        const result = await runQuery(sql, [name, description, icon]);

        const newCategory = await getQuery('SELECT * FROM categories WHERE id = ?', [result.id]);
        res.status(201).json(newCategory);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
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

                return {
                    ...category,
                    productCount: productCount[0].count,
                    featuredCount: featuredCount[0].count
                };
            })
        );

        res.json(categoriesWithStats);
    } catch (error) {
        console.error('Error fetching category stats:', error);
        res.status(500).json({ error: 'Failed to fetch category stats' });
    }
});

module.exports = router;