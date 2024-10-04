#!/bin/bash

# Build the frontend
cd frontend
npm run build

# Navigate back to the root directory
cd ..

# Start FastAPI server in production mode
uvicorn main:app --host 0.0.0.0 --port 8000