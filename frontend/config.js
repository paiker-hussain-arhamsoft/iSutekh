// Simple Configuration for iSutekh
// Development configuration only

// API endpoints
export const API_ENDPOINTS = {
    // Node.js API endpoints
    PRODUCTS: 'http://localhost:3000/api/products',
    CATEGORIES: 'http://localhost:3000/api/categories',
    CART: 'http://localhost:3000/api/cart',
    ORDERS: 'http://localhost:3000/api/orders',
    STATS: 'http://localhost:3000/api/stats',
    
    // Python API endpoints
    AUTH_LOGIN: 'http://localhost:5000/auth/login',
    AUTH_REGISTER: 'http://localhost:5000/auth/register',
    AUTH_LOGOUT: 'http://localhost:5000/auth/logout',
    AUTH_PROFILE: 'http://localhost:5000/auth/profile',
    AUTH_REFRESH: 'http://localhost:5000/auth/refresh',
    
    // Frontend URLs
    FRONTEND_URL: 'http://localhost:8080'
};

// Environment info
export const ENV_INFO = {
    isDevelopment: true,
    environment: 'development',
    hostname: window.location.hostname
};

// Log configuration in console
console.log('🚀 iSutekh Configuration:', {
    environment: ENV_INFO.environment,
    hostname: ENV_INFO.hostname,
    apiUrls: {
        node: 'http://localhost:3000',
        python: 'http://localhost:5000',
        frontend: 'http://localhost:8080'
    }
});
