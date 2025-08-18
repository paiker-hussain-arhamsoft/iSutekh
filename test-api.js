// Simple API test script for Nature Republic backend
const API_BASE_URL = 'http://localhost:3000';

async function testAPI() {
    console.log('🧪 Testing Nature Republic API endpoints...\n');
    
    try {
        // Test health check
        console.log('1. Testing health check...');
        const healthResponse = await fetch(`${API_BASE_URL}/api/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);
        
        // Test categories endpoint
        console.log('\n2. Testing categories endpoint...');
        const categoriesResponse = await fetch(`${API_BASE_URL}/api/categories`);
        const categories = await categoriesResponse.json();
        console.log('✅ Categories loaded:', categories.length, 'categories');
        categories.forEach(cat => console.log(`   - ${cat.name}: ${cat.description}`));
        
        // Test products endpoint
        console.log('\n3. Testing products endpoint...');
        const productsResponse = await fetch(`${API_BASE_URL}/api/products`);
        const products = await productsResponse.json();
        console.log('✅ Products loaded:', products.length, 'products');
        
        // Test category with products
        if (categories.length > 0) {
            console.log('\n4. Testing category products...');
            const categoryId = categories[0].id;
            const categoryProductsResponse = await fetch(`${API_BASE_URL}/api/categories/${categoryId}/products`);
            const categoryProducts = await categoryProductsResponse.json();
            console.log('✅ Category products:', categoryProducts.productCount, 'products in', categoryProducts.category.name);
        }
        
        console.log('\n🎉 All API tests passed!');
        
    } catch (error) {
        console.error('❌ API test failed:', error.message);
        console.log('\n💡 Make sure the Node.js backend is running on port 3000');
        console.log('   Run: cd node-backend && npm start');
    }
}

// Run the test
testAPI();
