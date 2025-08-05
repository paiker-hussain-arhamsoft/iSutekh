const express = require('express');
const router = express.Router();
const { getQuery, allQuery } = require('../database/database');

// Get dashboard statistics
router.get('/', async (req, res) => {
    try {
        // Get basic counts
        const totalProducts = await getQuery('SELECT COUNT(*) as count FROM products');
        const totalOrders = await getQuery('SELECT COUNT(*) as count FROM orders');
        const totalRevenue = await getQuery('SELECT SUM(total) as total FROM orders WHERE status != "cancelled"');
        
        // Get recent orders (last 7 days)
        const recentOrders = await allQuery(`
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE createdAt >= datetime('now', '-7 days')
        `);

        // Get low stock products
        const lowStockProducts = await allQuery(`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE stock <= 10 AND status = 'active'
        `);

        // Get top selling products
        const topProducts = await allQuery(`
            SELECT p.id, p.name, p.category, p.price, p.stock, p.rating,
                   COUNT(o.id) as orderCount
            FROM products p
            LEFT JOIN orders o ON o.items LIKE '%"id":' || p.id || '%'
            WHERE p.status = 'active'
            GROUP BY p.id
            ORDER BY orderCount DESC
            LIMIT 5
        `);

        // Get category distribution
        const categoryStats = await allQuery(`
            SELECT category, COUNT(*) as productCount
            FROM products
            WHERE status = 'active'
            GROUP BY category
            ORDER BY productCount DESC
        `);

        // Get order status distribution
        const orderStatusStats = await allQuery(`
            SELECT status, COUNT(*) as count
            FROM orders
            GROUP BY status
        `);

        // Get monthly revenue (last 6 months)
        const monthlyRevenue = await allQuery(`
            SELECT 
                strftime('%Y-%m', createdAt) as month,
                SUM(total) as revenue,
                COUNT(*) as orderCount
            FROM orders
            WHERE status != 'cancelled'
            AND createdAt >= datetime('now', '-6 months')
            GROUP BY month
            ORDER BY month DESC
        `);

        res.json({
            totalProducts: totalProducts.count,
            totalOrders: totalOrders.count,
            totalRevenue: totalRevenue.total || 0,
            recentOrders: recentOrders[0].count,
            lowStockProducts: lowStockProducts[0].count,
            topProducts,
            categoryStats,
            orderStatusStats,
            monthlyRevenue
        });
    } catch (error) {
        console.error('Error fetching statistics:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Get product statistics
router.get('/products', async (req, res) => {
    try {
        const totalProducts = await getQuery('SELECT COUNT(*) as count FROM products');
        const activeProducts = await getQuery('SELECT COUNT(*) as count FROM products WHERE status = "active"');
        const featuredProducts = await getQuery('SELECT COUNT(*) as count FROM products WHERE featured = 1');
        const outOfStockProducts = await getQuery('SELECT COUNT(*) as count FROM products WHERE stock = 0');
        const lowStockProducts = await getQuery('SELECT COUNT(*) as count FROM products WHERE stock <= 10 AND stock > 0');

        // Average product price
        const avgPrice = await getQuery('SELECT AVG(price) as average FROM products WHERE status = "active"');

        // Category distribution
        const categoryDistribution = await allQuery(`
            SELECT category, COUNT(*) as count
            FROM products
            WHERE status = 'active'
            GROUP BY category
            ORDER BY count DESC
        `);

        // Price range distribution
        const priceRanges = await allQuery(`
            SELECT 
                CASE 
                    WHEN price < 25 THEN 'Under $25'
                    WHEN price < 50 THEN '$25-$50'
                    WHEN price < 100 THEN '$50-$100'
                    ELSE 'Over $100'
                END as priceRange,
                COUNT(*) as count
            FROM products
            WHERE status = 'active'
            GROUP BY priceRange
            ORDER BY 
                CASE priceRange
                    WHEN 'Under $25' THEN 1
                    WHEN '$25-$50' THEN 2
                    WHEN '$50-$100' THEN 3
                    WHEN 'Over $100' THEN 4
                END
        `);

        res.json({
            totalProducts: totalProducts.count,
            activeProducts: activeProducts.count,
            featuredProducts: featuredProducts.count,
            outOfStockProducts: outOfStockProducts.count,
            lowStockProducts: lowStockProducts.count,
            averagePrice: avgPrice.average || 0,
            categoryDistribution,
            priceRanges
        });
    } catch (error) {
        console.error('Error fetching product statistics:', error);
        res.status(500).json({ error: 'Failed to fetch product statistics' });
    }
});

// Get order statistics
router.get('/orders', async (req, res) => {
    try {
        const totalOrders = await getQuery('SELECT COUNT(*) as count FROM orders');
        const totalRevenue = await getQuery('SELECT SUM(total) as total FROM orders WHERE status != "cancelled"');
        const averageOrderValue = await getQuery('SELECT AVG(total) as average FROM orders WHERE status != "cancelled"');

        // Orders by status
        const ordersByStatus = await allQuery(`
            SELECT status, COUNT(*) as count
            FROM orders
            GROUP BY status
            ORDER BY count DESC
        `);

        // Recent orders (last 30 days)
        const recentOrders = await allQuery(`
            SELECT 
                DATE(createdAt) as date,
                COUNT(*) as orderCount,
                SUM(total) as dailyRevenue
            FROM orders
            WHERE createdAt >= datetime('now', '-30 days')
            GROUP BY DATE(createdAt)
            ORDER BY date DESC
        `);

        // Top customers
        const topCustomers = await allQuery(`
            SELECT 
                customerName,
                customerEmail,
                COUNT(*) as orderCount,
                SUM(total) as totalSpent
            FROM orders
            WHERE customerName IS NOT NULL
            GROUP BY customerEmail
            ORDER BY totalSpent DESC
            LIMIT 10
        `);

        res.json({
            totalOrders: totalOrders.count,
            totalRevenue: totalRevenue.total || 0,
            averageOrderValue: averageOrderValue.average || 0,
            ordersByStatus,
            recentOrders,
            topCustomers
        });
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({ error: 'Failed to fetch order statistics' });
    }
});

// Get revenue statistics
router.get('/revenue', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        
        let dateFormat, dateFilter;
        switch (period) {
            case 'day':
                dateFormat = '%Y-%m-%d';
                dateFilter = 'datetime("now", "-30 days")';
                break;
            case 'week':
                dateFormat = '%Y-W%W';
                dateFilter = 'datetime("now", "-12 weeks")';
                break;
            case 'month':
            default:
                dateFormat = '%Y-%m';
                dateFilter = 'datetime("now", "-12 months")';
                break;
        }

        const revenueData = await allQuery(`
            SELECT 
                strftime('${dateFormat}', createdAt) as period,
                SUM(total) as revenue,
                COUNT(*) as orderCount,
                AVG(total) as averageOrderValue
            FROM orders
            WHERE status != 'cancelled'
            AND createdAt >= ${dateFilter}
            GROUP BY period
            ORDER BY period DESC
        `);

        // Calculate growth
        let growth = 0;
        if (revenueData.length >= 2) {
            const currentPeriod = revenueData[0].revenue || 0;
            const previousPeriod = revenueData[1].revenue || 0;
            if (previousPeriod > 0) {
                growth = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
            }
        }

        res.json({
            period,
            revenueData,
            growth: Math.round(growth * 100) / 100
        });
    } catch (error) {
        console.error('Error fetching revenue statistics:', error);
        res.status(500).json({ error: 'Failed to fetch revenue statistics' });
    }
});

// Get inventory statistics
router.get('/inventory', async (req, res) => {
    try {
        const totalStock = await getQuery('SELECT SUM(stock) as total FROM products WHERE status = "active"');
        const outOfStock = await getQuery('SELECT COUNT(*) as count FROM products WHERE stock = 0 AND status = "active"');
        const lowStock = await getQuery('SELECT COUNT(*) as count FROM products WHERE stock <= 10 AND stock > 0 AND status = "active"');
        const wellStocked = await getQuery('SELECT COUNT(*) as count FROM products WHERE stock > 10 AND status = "active"');

        // Products by stock level
        const stockLevels = await allQuery(`
            SELECT 
                CASE 
                    WHEN stock = 0 THEN 'Out of Stock'
                    WHEN stock <= 5 THEN 'Critical (1-5)'
                    WHEN stock <= 10 THEN 'Low (6-10)'
                    WHEN stock <= 25 THEN 'Medium (11-25)'
                    ELSE 'Well Stocked (25+)'
                END as stockLevel,
                COUNT(*) as count
            FROM products
            WHERE status = 'active'
            GROUP BY stockLevel
            ORDER BY 
                CASE stockLevel
                    WHEN 'Out of Stock' THEN 1
                    WHEN 'Critical (1-5)' THEN 2
                    WHEN 'Low (6-10)' THEN 3
                    WHEN 'Medium (11-25)' THEN 4
                    WHEN 'Well Stocked (25+)' THEN 5
                END
        `);

        // Low stock products
        const lowStockProducts = await allQuery(`
            SELECT id, name, category, stock, price
            FROM products
            WHERE stock <= 10 AND status = 'active'
            ORDER BY stock ASC
            LIMIT 10
        `);

        res.json({
            totalStock: totalStock.total || 0,
            outOfStock: outOfStock.count,
            lowStock: lowStock.count,
            wellStocked: wellStocked.count,
            stockLevels,
            lowStockProducts
        });
    } catch (error) {
        console.error('Error fetching inventory statistics:', error);
        res.status(500).json({ error: 'Failed to fetch inventory statistics' });
    }
});

module.exports = router;