# Campus Marketplace (SE Project)

This repository contains the source code for the Web3 Campus Marketplace.

## Project Structure

*   **`frontend/`**: The frontend application built with React, Vite, Ant Design, and RainbowKit.
*   **`backend.md`**: Documentation for the backend API endpoints.

## 🚀 Getting Started

If you are a new developer (or cloning this repo for the first time), follow these steps to get the frontend running:

### 1. Prerequisite
Ensure you have **Node.js** installed on your computer.

### 2. Install Dependencies
The `package.json` file is located in the `frontend` folder, so you need to enter that folder first.

```bash
# 1. Enter the frontend directory
cd frontend

# 2. Install all required npm packages
npm install
```

### 3. Run the App
```bash
# Start the local development server
npm run dev
```

The app will typically run at `http://localhost:5173`.

## ⚙️ Configuration
*   **API Endpoint**: The frontend is currently configured to connect to `http://192.168.0.7:8080` (See `frontend/src/utils/api.ts`).
*   **Wallet**: Requires a browser wallet extension like MetaMask.
