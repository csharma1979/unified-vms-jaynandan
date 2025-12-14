#!/bin/bash

# Exit on any error
set -e

echo "Starting Service Business Management System development environment..."

# Start backend in background
echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start frontend in background
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Function to kill background processes on exit
cleanup() {
    echo "Shutting down development servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    wait $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    echo "Servers shut down."
}
trap cleanup EXIT

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID