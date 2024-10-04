#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

log_step() {
    echo "==== $1 ===="
}

# Function to check if a port is in use
port_in_use() {
    (echo >/dev/tcp/localhost/$1) &>/dev/null && return 0 || return 1
}

# Function to find an available port
find_available_port() {
    local port=$1
    while port_in_use $port; do
        ((port++))
    done
    echo $port
}

# Run the cleanup script
# log_step "Running cleanup script"
# bash cleanup.sh

# Navigate to frontend directory
log_step "Navigating to frontend directory"
cd frontend

# Install dependencies
log_step "Installing dependencies"
npm install

# Ensure Tailwind CSS is initialized
log_step "Initializing Tailwind CSS"
npx tailwindcss init -p

# Clean and rebuild the frontend
log_step "Cleaning and rebuilding frontend"
rm -rf dist
npm run build

# Start Vite dev server
log_step "Starting Vite dev server"
npm run dev &

# Navigate back to the root directory
cd ..

# Find an available port for FastAPI
backend_port=$(find_available_port 8000)

# Start FastAPI server
log_step "Starting FastAPI server on port $backend_port"
uvicorn main:app --host 0.0.0.0 --port $backend_port --reload &

log_step "Development environment started"
echo "Frontend: Check the Vite output for the correct URL (likely http://localhost:5174 or http://localhost:5175)"
echo "Backend: http://localhost:$backend_port"

# Keep the script running
wait