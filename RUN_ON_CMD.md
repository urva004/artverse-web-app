# 🚀 Run ArtVerse on Windows Command Prompt (CMD)

This guide shows you how to run the ArtVerse project using **Command Prompt (CMD)**. 

> [!IMPORTANT]
> **Why use CMD?**
> Windows PowerShell often blocks running package managers like `npm` with the error: 
> *`File npm.ps1 cannot be loaded because running scripts is disabled on this system.`*
> Using **Command Prompt (CMD)** completely avoids this security check!

---

## 🏃‍♂️ Step-by-Step Run Guide

### 1. Open Command Prompt in the Project Folder
- Open your file explorer, go to `E:\projects\artverse-web-app`.
- Click on the address bar at the top, type **`cmd`**, and press **Enter**.
- A new Command Prompt window will open directly in your project folder.

### 2. Install Dependencies
Run this command to install the required packages across the monorepo:
```cmd
npm install
```

### 3. Generate Prisma Database Client
Generate the typed database client to communicate with your Neon PostgreSQL database:
```cmd
npx prisma generate --schema=./prisma/schema.prisma
```

### 4. Start the Development Servers
Start both the Next.js frontend and Express backend concurrently:
```cmd
npm run dev
```

---

## 🌐 Project URLs

Once started, the services will be running at:
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:4000](http://localhost:4000)

---

## 🔑 Test Accounts
You can log in at `http://localhost:3000/auth/login` using these pre-seeded test credentials:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@artverse.com` | `Password@123` |
| **Seller** | `priya@artverse.com` | `Password@123` |
| **Buyer** | `rahul@artverse.com` | `Password@123` |
