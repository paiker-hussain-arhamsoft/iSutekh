const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Database connection
const dbPath = path.join(__dirname, '..', 'nature_republic.db');
const db = new sqlite3.Database(dbPath);

// Get all reviews for a product
router.get('/product/:productId', (req, res) => {
    const { productId } = req.params;
    
    const sql = `
        SELECT r.*, u.name as userName, u.avatar
        FROM reviews r
        LEFT JOIN users u ON r.userId = u.id
        WHERE r.productId = ?
        ORDER BY r.createdAt DESC
    `;
    
    db.all(sql, [productId], (err, reviews) => {
        if (err) {
            console.error('Error fetching reviews:', err);
            return res.status(500).json({ error: 'Failed to fetch reviews' });
        }
        
        res.json(reviews);
    });
});

// Get all reviews (for admin)
router.get('/', (req, res) => {
    const sql = `
        SELECT r.*, p.name as productName, u.name as userName
        FROM reviews r
        LEFT JOIN products p ON r.productId = p.id
        LEFT JOIN users u ON r.userId = u.id
        ORDER BY r.createdAt DESC
    `;
    
    db.all(sql, [], (err, reviews) => {
        if (err) {
            console.error('Error fetching all reviews:', err);
            return res.status(500).json({ error: 'Failed to fetch reviews' });
        }
        
        res.json(reviews);
    });
});

// Add a new review
router.post('/', async (req, res) => {
    const { productId, userId, rating, title, comment } = req.body;
    
    // Validate required fields
    if (!productId || !userId || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate rating range
    if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    
    try {
        // Get user info
        const userSql = 'SELECT name, email FROM users WHERE id = ?';
        db.get(userSql, [userId], async (err, user) => {
            if (err || !user) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            // Insert review
            const insertSql = `
                INSERT INTO reviews (productId, userId, userName, userEmail, rating, title, comment)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(insertSql, [productId, userId, user.name, user.email, rating, title, comment], function(err) {
                if (err) {
                    console.error('Error inserting review:', err);
                    return res.status(500).json({ error: 'Failed to add review' });
                }
                
                const reviewId = this.lastID;
                
                // Update product rating and review count
                updateProductRating(productId);
                
                // Return the new review
                const newReview = {
                    id: reviewId,
                    productId,
                    userId,
                    userName: user.name,
                    userEmail: user.email,
                    rating,
                    title,
                    comment,
                    helpful: 0,
                    createdAt: new Date().toISOString()
                };
                
                res.status(201).json(newReview);
            });
        });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ error: 'Failed to add review' });
    }
});

// Update a review
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { rating, title, comment } = req.body;
    
    const sql = 'UPDATE reviews SET rating = ?, title = ?, comment = ? WHERE id = ?';
    
    db.run(sql, [rating, title, comment, id], function(err) {
        if (err) {
            console.error('Error updating review:', err);
            return res.status(500).json({ error: 'Failed to update review' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        // Update product rating
        const getProductSql = 'SELECT productId FROM reviews WHERE id = ?';
        db.get(getProductSql, [id], (err, review) => {
            if (!err && review) {
                updateProductRating(review.productId);
            }
        });
        
        res.json({ message: 'Review updated successfully' });
    });
});

// Delete a review
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    
    // Get product ID before deleting
    const getProductSql = 'SELECT productId FROM reviews WHERE id = ?';
    db.get(getProductSql, [id], (err, review) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch review' });
        }
        
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        
        const productId = review.productId;
        
        // Delete the review
        const deleteSql = 'DELETE FROM reviews WHERE id = ?';
        db.run(deleteSql, [id], function(err) {
            if (err) {
                console.error('Error deleting review:', err);
                return res.status(500).json({ error: 'Failed to delete review' });
            }
            
            // Update product rating
            updateProductRating(productId);
            
            res.json({ message: 'Review deleted successfully' });
        });
    });
});

// Mark review as helpful
router.post('/:id/helpful', (req, res) => {
    const { id } = req.params;
    
    const sql = 'UPDATE reviews SET helpful = helpful + 1 WHERE id = ?';
    
    db.run(sql, [id], function(err) {
        if (err) {
            console.error('Error updating helpful count:', err);
            return res.status(500).json({ error: 'Failed to update helpful count' });
        }
        
        res.json({ message: 'Helpful count updated' });
    });
});

// Helper function to update product rating and review count
function updateProductRating(productId) {
    const sql = `
        UPDATE products 
        SET rating = (
            SELECT AVG(rating) 
            FROM reviews 
            WHERE productId = ?
        ),
        reviewCount = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE productId = ?
        ),
        updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?
    `;
    
    db.run(sql, [productId, productId, productId], (err) => {
        if (err) {
            console.error('Error updating product rating:', err);
        }
    });
}

module.exports = router;
