# Nature Republic Ecommerce Website - Installation Guide

## 🌸 Overview

Nature Republic is a modern ecommerce website for beauty products with a beautiful pink theme. It features both Node.js and Python backends, providing a complete solution for product management, user authentication, and order processing.

## 🛠️ Prerequisites

Before installing Nature Republic, make sure you have the following installed on your system:

### Required Software
- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **Python 3** (v3.8 or higher) - [Download here](https://www.python.org/downloads/)
- **Git** - [Download here](https://git-scm.com/)

### Verify Installation
```bash
# Check Node.js version
node --version

# Check Python version
python3 --version

# Check Git version
git --version
```

## 📦 Installation

### Option 1: Quick Start (Recommended)

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd nature-republic
   ```

2. **Run the startup script**
   ```bash
   ./start.sh
   ```

   This script will:
   - Check prerequisites
   - Install all dependencies
   - Start both backend servers
   - Start the frontend server
   - Open the application in your browser

### Option 2: Manual Installation

#### Step 1: Install Node.js Backend

```bash
cd node-backend
npm install
npm start
```

The Node.js server will run on `http://localhost:3000`

#### Step 2: Install Python Backend

```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

The Python server will run on `http://localhost:5000`

#### Step 3: Serve Frontend

```bash
cd frontend
python3 -m http.server 8080
```

The frontend will be available at `http://localhost:8080`

## 🌐 Accessing the Application

Once all servers are running, you can access:

- **Main Website**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin.html
- **Node.js API**: http://localhost:3000
- **Python API**: http://localhost:5000

## 👤 Default Admin Credentials

- **Email**: admin@naturerepublic.com
- **Password**: admin123

## 📁 Project Structure

```
nature-republic/
├── frontend/                 # Frontend files
│   ├── index.html           # Main website
│   ├── admin.html           # Admin panel
│   ├── styles.css           # Main styles
│   ├── admin-styles.css     # Admin styles
│   ├── script.js            # Main JavaScript
│   └── admin.js             # Admin JavaScript
├── node-backend/            # Node.js backend
│   ├── server.js            # Main server file
│   ├── package.json         # Dependencies
│   ├── database/            # Database files
│   └── routes/              # API routes
├── python-backend/          # Python backend
│   ├── app.py               # Flask application
│   └── requirements.txt     # Python dependencies
├── database/                # SQLite database files
├── docs/                    # Documentation
├── start.sh                 # Startup script
└── README.md                # Main documentation
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Node.js Backend
NODE_ENV=development
PORT=3000

# Python Backend
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here
```

### Database Configuration

The application uses SQLite databases:
- **Products/Categories/Orders**: `database/nature_republic.db`
- **Users**: `python-backend/nature_republic_users.db`

## 🚀 Features

### Frontend Features
- ✅ Beautiful pink theme design
- ✅ Responsive layout
- ✅ Product catalog with categories
- ✅ Shopping cart functionality
- ✅ User authentication
- ✅ Search and filter products
- ✅ Product ratings and reviews

### Admin Panel Features
- ✅ Dashboard with statistics
- ✅ Product management (CRUD)
- ✅ Category management
- ✅ Order management
- ✅ User management
- ✅ Inventory tracking
- ✅ Sales analytics

### Backend Features
- ✅ RESTful APIs
- ✅ JWT authentication
- ✅ Database management
- ✅ File upload support
- ✅ Error handling
- ✅ Security features

## 🛡️ Security Features

- JWT token authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention

## 📊 API Endpoints

### Node.js API (Port 3000)

#### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

#### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

#### Orders
- `GET /api/orders` - Get all orders
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id/status` - Update order status

#### Statistics
- `GET /api/stats` - Dashboard statistics
- `GET /api/stats/products` - Product statistics
- `GET /api/stats/orders` - Order statistics

### Python API (Port 5000)

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update profile

#### Users
- `GET /users` - Get all users (admin only)
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user (admin only)
- `DELETE /users/:id` - Delete user (admin only)

## 🐛 Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Find process using port
   lsof -i :3000
   lsof -i :5000
   lsof -i :8080
   
   # Kill process
   kill -9 <PID>
   ```

2. **Node.js dependencies not installed**
   ```bash
   cd node-backend
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Python virtual environment issues**
   ```bash
   cd python-backend
   rm -rf venv
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Database issues**
   ```bash
   # Remove existing databases
   rm database/nature_republic.db
   rm python-backend/nature_republic_users.db
   
   # Restart servers to recreate databases
   ```

### Logs

Check server logs for errors:
- Node.js: Check terminal where `npm start` is running
- Python: Check terminal where `python app.py` is running

## 🔄 Updates

To update the application:

1. **Pull latest changes**
   ```bash
   git pull origin main
   ```

2. **Update dependencies**
   ```bash
   # Node.js
   cd node-backend
   npm install
   
   # Python
   cd python-backend
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Restart servers**
   ```bash
   ./start.sh
   ```

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check server logs for error messages
4. Ensure all ports are available
5. Try the manual installation steps

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.