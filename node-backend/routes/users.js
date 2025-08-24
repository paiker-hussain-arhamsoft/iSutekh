const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Database connection
const dbPath = path.join(__dirname, '..', 'nature_republic.db');
const db = new sqlite3.Database(dbPath);

// JWT secret (in production, use environment variable)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// User registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    // Validate password length
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    
    try {
        // Check if user already exists
        const checkSql = 'SELECT id FROM users WHERE email = ?';
        db.get(checkSql, [email], async (err, existingUser) => {
            if (err) {
                console.error('Error checking existing user:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (existingUser) {
                return res.status(409).json({ error: 'User with this email already exists' });
            }
            
            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insert new user
            const insertSql = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
            db.run(insertSql, [name, email, hashedPassword], function(err) {
                if (err) {
                    console.error('Error creating user:', err);
                    return res.status(500).json({ error: 'Failed to create user' });
                }
                
                const userId = this.lastID;
                
                // Generate JWT token
                const token = jwt.sign(
                    { userId, email, name },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );
                
                // Return user data (without password) and token
                const user = {
                    id: userId,
                    name,
                    email,
                    createdAt: new Date().toISOString()
                };
                
                res.status(201).json({
                    message: 'User created successfully',
                    user,
                    token
                });
            });
        });
    } catch (error) {
        console.error('Error in registration:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// User login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        // Find user by email
        const sql = 'SELECT id, name, email, password FROM users WHERE email = ?';
        db.get(sql, [email], async (err, user) => {
            if (err) {
                console.error('Error finding user:', err);
                return res.status(500).json({ error: 'Database error' });
            }
            
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            
            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }
            
            // Generate JWT token
            const token = jwt.sign(
                { userId: user.id, email: user.email, name: user.name },
                JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            // Return user data (without password) and token
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email
            };
            
            res.json({
                message: 'Login successful',
                user: userData,
                token
            });
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, (req, res) => {
    const userId = req.user.userId;
    
    const sql = 'SELECT id, name, email, avatar, createdAt FROM users WHERE id = ?';
    db.get(sql, [userId], (err, user) => {
        if (err) {
            console.error('Error fetching user profile:', err);
            return res.status(500).json({ error: 'Failed to fetch profile' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    });
});

// Update user profile (protected route)
router.put('/profile', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { name, avatar } = req.body;
    
    try {
        const sql = 'UPDATE users SET name = ?, avatar = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?';
        db.run(sql, [name, avatar, userId], function(err) {
            if (err) {
                console.error('Error updating profile:', err);
                return res.status(500).json({ error: 'Failed to update profile' });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            
            res.json({ message: 'Profile updated successfully' });
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        req.user = user;
        next();
    });
}

module.exports = router;
