#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status.

log_step() {
    echo "==== $1 ===="
}

# Navigate to the frontend directory
log_step "Navigating to frontend directory"
cd frontend

# Remove Vue.js related configuration files
log_step "Removing Vue.js related files"
rm -f tsconfig.app.json tsconfig.config.json tsconfig.vitest.json tsconfig.node.json

# Update tsconfig.json
log_step "Updating tsconfig.json"
cat > tsconfig.json << EOL
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
EOL

# Update vite.config.ts
log_step "Updating vite.config.ts"
cat > vite.config.ts << EOL
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
    strictPort: false,
  },
})
EOL

# Check and update index.css
log_step "Checking and updating src/index.css"
mkdir -p src
cat > src/index.css << EOL
@tailwind base;
@tailwind components;
@tailwind utilities;
EOL

echo "Updated contents of src/index.css:"
cat src/index.css

# Update package.json scripts
log_step "Updating package.json scripts"
npm pkg set scripts.dev="vite"
npm pkg set scripts.build="tsc && vite build"
npm pkg set scripts.lint="eslint src --ext ts,tsx --report-unused-disable-directives --max-warnings 0"
npm pkg set scripts.preview="vite preview"

# Install necessary dependencies
log_step "Installing dependencies"
npm install @vitejs/plugin-react @types/react @types/react-dom tailwindcss postcss autoprefixer --save-dev

# Remove any Vue.js related dependencies
npm uninstall @vue/tsconfig

# Initialize Tailwind CSS
log_step "Initializing Tailwind CSS"
cat > tailwind.config.js << EOL
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOL

# Update PostCSS config
log_step "Updating PostCSS config"
cat > postcss.config.js << EOL
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# Display contents of important files for debugging
log_step "Displaying contents of important files"
echo "tsconfig.json:"
cat tsconfig.json
echo "vite.config.ts:"
cat vite.config.ts
echo "tailwind.config.js:"
cat tailwind.config.js
echo "postcss.config.js:"
cat postcss.config.js

echo "Cleanup completed successfully!"