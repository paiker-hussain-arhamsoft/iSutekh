// Simple authentication test script for Nature Republic
const API_BASE_URL = 'http://localhost:5000';

async function testAuth() {
    console.log('🧪 Testing Nature Republic Authentication System...\n');

    try {
        // Test 1: Health check
        console.log('1. Testing health check...');
        const healthResponse = await fetch(`${API_BASE_URL}/`);
        const healthData = await healthResponse.json();
        console.log('✅ Health check:', healthData);

        // Test 2: User registration
        console.log('\n2. Testing user registration...');
        const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                password: 'test123'
            })
        });
        
        if (registerResponse.ok) {
            const registerData = await registerResponse.json();
            console.log('✅ User registered:', registerData.message);
            console.log('   User ID:', registerData.user.id);
            console.log('   Token:', registerData.token.substring(0, 20) + '...');
        } else {
            const error = await registerResponse.json();
            console.log('⚠️ Registration response:', error);
        }

        // Test 3: User login
        console.log('\n3. Testing user login...');
        const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123'
            })
        });
        
        if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('✅ User logged in:', loginData.message);
            console.log('   User:', loginData.user.name);
            console.log('   Role:', loginData.user.role);
            console.log('   Token:', loginData.token.substring(0, 20) + '...');
            
            // Test 4: Get user profile with token
            console.log('\n4. Testing authenticated profile access...');
            const profileResponse = await fetch(`${API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${loginData.token}`
                }
            });
            
            if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                console.log('✅ Profile accessed:', profileData.user.name);
            } else {
                const error = await profileResponse.json();
                console.log('❌ Profile access failed:', error);
            }
            
            // Test 5: Admin login
            console.log('\n5. Testing admin login...');
            const adminLoginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                                 body: JSON.stringify({
                     email: 'admin@naturerepublic.com',
                     password: 'admin123'
                 })
            });
            
            if (adminLoginResponse.ok) {
                const adminData = await adminLoginResponse.json();
                console.log('✅ Admin logged in:', adminData.message);
                console.log('   Admin:', adminData.user.name);
                console.log('   Role:', adminData.user.role);
                
                // Test 6: Get users list (admin only)
                console.log('\n6. Testing admin users access...');
                const usersResponse = await fetch(`${API_BASE_URL}/users`, {
                    headers: {
                        'Authorization': `Bearer ${adminData.token}`
                    }
                });
                
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    console.log('✅ Users list accessed:', usersData.users.length, 'users');
                    usersData.users.forEach(user => {
                        console.log(`   - ${user.name} (${user.email}) - ${user.role}`);
                    });
                } else {
                    const error = await usersResponse.json();
                    console.log('❌ Users access failed:', error);
                }
            } else {
                const error = await adminLoginResponse.json();
                console.log('❌ Admin login failed:', error);
            }
            
        } else {
            const error = await loginResponse.json();
            console.log('❌ Login failed:', error);
        }

        console.log('\n🎉 Authentication system test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\n💡 Make sure the Python backend is running on port 5000');
        console.log('   Run: cd python-backend && python app.py');
    }
}

// Run the test
testAuth();
