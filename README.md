./s# Nature Republic - Ecommerce Website

A beautiful ecommerce platform for beauty products with a pink theme, featuring both Node.js and Python backends.

## Features

- 🛍️ **Product Catalog** - Browse beauty products with categories
- 🏷️ **Category Pages** - Dedicated pages for each product category
- 🛒 **Shopping Cart** - Add, remove, and manage items
- 👤 **User Authentication** - Secure login and registration
- 💳 **Payment Integration** - Stripe payment processing
- 📱 **Responsive Design** - Mobile-friendly interface
- 🎨 **Pink Theme** - Beautiful beauty-focused design
- 🔍 **Search & Filter** - Find products easily
- ⭐ **Reviews & Ratings** - Customer feedback system

## Tech Stack

### Frontend
- HTML5, CSS3, JavaScript
- Bootstrap 5 (pink theme)
- Font Awesome icons

### Backend
- **Node.js** - Product management, cart, orders
- **Python (Flask)** - User authentication, reviews
- **SQLite** - Database
- **Stripe** - Payment processing

## Project Structure

```
nature-republic/
├── frontend/          # HTML, CSS, JS files
├── node-backend/      # Node.js server
├── python-backend/    # Python Flask server
├── database/          # SQLite database
└── docs/             # Documentation
```

## 🏷️ Category Pages

The website features dedicated category pages for enhanced product browsing:

- **URL Format**: `http://localhost:8080/category.html?category=CategoryName`
- **Example**: `http://localhost:8080/category.html?category=Makeup`
- **Features**: 
  - Product filtering and search
  - Price range filtering
  - Sorting options (name, price, rating)
  - Pagination (12 products per page)
  - Full cart functionality
  - Responsive design
  - Breadcrumb navigation

## 🛍️ Product Detail Pages

Individual product pages provide comprehensive product information:

- **URL Format**: `http://localhost:8080/product.html?id=ProductID`
- **Example**: `http://localhost:8080/product.html?id=1`
- **Features**:
  - High-resolution product images with thumbnail gallery
  - Detailed product descriptions and specifications
  - Customer reviews and ratings
  - Quantity selector and add to cart functionality
  - Wishlist functionality
  - Related products from the same category
  - Breadcrumb navigation
  - Responsive design for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14+)
- Python 3 (v3.8+)
- Git

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd nature-republic

# Run the startup script (recommended)
./start.sh
```

Or install manually:

```bash
# Node.js Backend
cd node-backend
npm install
npm start

# Python Backend (in new terminal)
cd python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py

# Frontend (in new terminal)
cd frontend
python3 -m http.server 8080
```

### Access the Application
- **Website**: http://localhost:8080
- **Admin Panel**: http://localhost:8080/admin.html
- **Admin Login**: admin@naturerepublic.com / admin123

📖 **For detailed installation instructions, see [docs/INSTALLATION.md](docs/INSTALLATION.md)**

## License

MIT License
