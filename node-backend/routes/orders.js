const express = require('express');
const router = express.Router();
const { runQuery, getQuery, allQuery } = require('../database/database');

// Get all orders
router.get('/', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;
        let sql = 'SELECT * FROM orders WHERE 1=1';
        const params = [];

        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }

        sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const orders = await allQuery(sql, params);
        
        // Parse items JSON for each order
        const ordersWithParsedItems = orders.map(order => ({
            ...order,
            items: JSON.parse(order.items)
        }));

        res.json(ordersWithParsedItems);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const order = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Parse items JSON
        order.items = JSON.parse(order.items);
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        const {
            customerId,
            customerName,
            customerEmail,
            items,
            total,
            shippingAddress,
            paymentMethod = 'credit_card'
        } = req.body;

        // Validation
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ error: 'Order items are required' });
        }

        if (!total || total <= 0) {
            return res.status(400).json({ error: 'Valid order total is required' });
        }

        // Validate items and check stock
        for (const item of items) {
            if (!item.id || !item.quantity || item.quantity <= 0) {
                return res.status(400).json({ error: 'Invalid item data' });
            }

            // Check product exists and has sufficient stock
            const product = await getQuery('SELECT * FROM products WHERE id = ?', [item.id]);
            if (!product) {
                return res.status(400).json({ error: `Product with ID ${item.id} not found` });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({ 
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
                });
            }
        }

        // Create order
        const sql = `
            INSERT INTO orders (customerId, customerName, customerEmail, items, total, shippingAddress, paymentMethod)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await runQuery(sql, [
            customerId,
            customerName,
            customerEmail,
            JSON.stringify(items),
            total,
            shippingAddress,
            paymentMethod
        ]);

        // Update product stock
        for (const item of items) {
            await runQuery(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.id]
            );
        }

        const newOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [result.id]);
        newOrder.items = JSON.parse(newOrder.items);
        
        res.status(201).json(newOrder);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid order status' });
        }

        // Check if order exists
        const existingOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // If cancelling order, restore stock
        if (status === 'cancelled' && existingOrder.status !== 'cancelled') {
            const items = JSON.parse(existingOrder.items);
            for (const item of items) {
                await runQuery(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.id]
                );
            }
        }

        // If order was cancelled and is being reactivated, reduce stock again
        if (existingOrder.status === 'cancelled' && status !== 'cancelled') {
            const items = JSON.parse(existingOrder.items);
            for (const item of items) {
                const product = await getQuery('SELECT * FROM products WHERE id = ?', [item.id]);
                if (product.stock < item.quantity) {
                    return res.status(400).json({ 
                        error: `Cannot reactivate order. Insufficient stock for ${product.name}` 
                    });
                }
                await runQuery(
                    'UPDATE products SET stock = stock - ? WHERE id = ?',
                    [item.quantity, item.id]
                );
            }
        }

        await runQuery(
            'UPDATE orders SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );

        const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
        updatedOrder.items = JSON.parse(updatedOrder.items);
        
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Update order
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            customerName,
            customerEmail,
            shippingAddress,
            paymentMethod
        } = req.body;

        // Check if order exists
        const existingOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const sql = `
            UPDATE orders 
            SET customerName = ?, customerEmail = ?, shippingAddress = ?, paymentMethod = ?, updatedAt = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await runQuery(sql, [
            customerName || existingOrder.customerName,
            customerEmail || existingOrder.customerEmail,
            shippingAddress || existingOrder.shippingAddress,
            paymentMethod || existingOrder.paymentMethod,
            id
        ]);

        const updatedOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
        updatedOrder.items = JSON.parse(updatedOrder.items);
        
        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if order exists
        const existingOrder = await getQuery('SELECT * FROM orders WHERE id = ?', [id]);
        if (!existingOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Restore stock if order is not cancelled
        if (existingOrder.status !== 'cancelled') {
            const items = JSON.parse(existingOrder.items);
            for (const item of items) {
                await runQuery(
                    'UPDATE products SET stock = stock + ? WHERE id = ?',
                    [item.quantity, item.id]
                );
            }
        }

        await runQuery('DELETE FROM orders WHERE id = ?', [id]);
        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Get orders by customer
router.get('/customer/:customerId', async (req, res) => {
    try {
        const { customerId } = req.params;
        const orders = await allQuery(
            'SELECT * FROM orders WHERE customerId = ? ORDER BY createdAt DESC',
            [customerId]
        );

        const ordersWithParsedItems = orders.map(order => ({
            ...order,
            items: JSON.parse(order.items)
        }));

        res.json(ordersWithParsedItems);
    } catch (error) {
        console.error('Error fetching customer orders:', error);
        res.status(500).json({ error: 'Failed to fetch customer orders' });
    }
});

// Get order statistics
router.get('/stats/summary', async (req, res) => {
    try {
        const totalOrders = await allQuery('SELECT COUNT(*) as count FROM orders');
        const totalRevenue = await allQuery('SELECT SUM(total) as total FROM orders WHERE status != "cancelled"');
        const pendingOrders = await allQuery('SELECT COUNT(*) as count FROM orders WHERE status = "pending"');
        const processingOrders = await allQuery('SELECT COUNT(*) as count FROM orders WHERE status = "processing"');

        const statusBreakdown = await allQuery(`
            SELECT status, COUNT(*) as count 
            FROM orders 
            GROUP BY status
        `);

        res.json({
            totalOrders: totalOrders[0].count,
            totalRevenue: totalRevenue[0].total || 0,
            pendingOrders: pendingOrders[0].count,
            processingOrders: processingOrders[0].count,
            statusBreakdown
        });
    } catch (error) {
        console.error('Error fetching order statistics:', error);
        res.status(500).json({ error: 'Failed to fetch order statistics' });
    }
});

module.exports = router;