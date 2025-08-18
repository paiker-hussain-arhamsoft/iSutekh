#!/bin/bash

echo "🌸 Nature Republic Ecommerce Website Startup Script 🌸"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ Prerequisites check passed!"

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
cd node-backend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Node.js dependencies already installed"
fi
cd ..

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
cd python-backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

source venv/bin/activate
pip install -r requirements.txt
cd ..

echo ""
echo "🚀 Starting servers..."
echo ""

# Start Node.js backend in background
echo "🔧 Starting Node.js backend (port 3000)..."
cd node-backend
npm start &
NODE_PID=$!
cd ..

# Start Python backend in background
echo "🐍 Starting Python backend (port 5000)..."
cd python-backend
source venv/bin/activate
python app.py &
PYTHON_PID=$!
cd ..

# Wait a moment for servers to start
sleep 3

echo ""
echo "✅ Servers started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Node.js API: http://localhost:3000"
echo "🐍 Python API: http://localhost:5000"
echo "👑 Admin Panel: http://localhost:8080/admin.html"
echo ""
echo "👤 Admin credentials:"
echo "   Email: admin@naturerepublic.com"
echo "   Password: admin123"
echo ""
echo "Press Ctrl+C to stop all servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $NODE_PID 2>/dev/null
    kill $PYTHON_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start a simple HTTP server for the frontend
echo "🌐 Starting frontend server (port 8080)..."
cd frontend
python3 -m http.server 8080 &
FRONTEND_PID=$!
cd ..

# Wait for all background processes
wait