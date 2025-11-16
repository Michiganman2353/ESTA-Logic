# ESTA Tracker - Michigan Earned Sick Time Act Compliance System

A modern, full-stack TypeScript monorepo application for managing Michigan's Earned Sick Time Act (ESTA) compliance. Built with Vite + React 18 (frontend) and Node.js + Express (backend), with PostgreSQL-ready database architecture.

## 🎯 Features

### Michigan ESTA Compliance
- ✅ **Small Employer Rules** (<10 employees): 40 hours sick time per year, max 40 paid + 32 unpaid hours usage, carryover cap 40 hours
- ✅ **Large Employer Rules** (≥10 employees): 1 hour accrual per 30 hours worked, max 72 paid hours per year, carryover cap 72 hours
- ✅ **Year-to-year carryover** with compliance caps
- ✅ **Usage categories** per Michigan law (illness, medical, preventive care, family care, domestic violence, sexual assault, stalking)
- ✅ **Anti-retaliation protections** with audit trail
- ✅ **3-year compliance audit trail** for state inspections

### Technical Features
- 🏗️ Modern Monorepo Architecture (npm workspaces)
- ⚡ Vite for lightning-fast development
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 🔒 Type-safe end-to-end with TypeScript
- 🧪 Vitest for testing
- 🐘 PostgreSQL-ready data layer

## 🚀 Quick Start

### Prerequisites
- Node.js ≥18.0.0
- npm ≥9.0.0

### Installation

```bash
git clone https://github.com/Michiganman2353/esta-tracker-clean.git
cd esta-tracker-clean
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3001

> 📚 See [ENVIRONMENT.md](./ENVIRONMENT.md) for detailed environment variable setup

## 🚀 Deployment

### Vercel Deployment

This project is optimized for Vercel deployment. See the [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) for detailed instructions.

Quick deploy:
1. Import repository to Vercel
2. Set environment variables (see [ENVIRONMENT.md](./ENVIRONMENT.md))
3. Deploy!

Configuration files:
- `vercel.json` - Vercel configuration
- `.nvmrc` - Node.js version (20.x)
- `.env.example` - Environment variables template

## 📋 Available Scripts

```bash
npm run dev              # Start both frontend and backend
npm run build            # Build all packages
npm run test             # Run tests in all packages
npm run lint             # Lint all packages
```

## 📚 Documentation

- [Environment Variables Setup](./ENVIRONMENT.md) - Configure environment variables
- [Vercel Deployment Guide](./VERCEL_DEPLOYMENT.md) - Deploy to Vercel
- [Dependency Management](./DEPENDENCIES.md) - Manage and update dependencies

## 🏗️ Architecture

### Monorepo Structure

```
esta-tracker-clean/
├── packages/
│   ├── frontend/        # React + Vite + TypeScript
│   │   ├── src/
│   │   ├── public/
│   │   └── dist/       # Build output
│   └── backend/         # Node.js + Express + TypeScript
│       ├── src/
│       └── dist/       # Build output
├── .nvmrc              # Node.js version
├── vercel.json         # Vercel configuration
└── package.json        # Root workspace config
```

### Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- Vitest for testing

**Backend:**
- Node.js + Express
- TypeScript
- PostgreSQL (via pg)
- JWT authentication
- Zod for validation
- Helmet for security

## 🔒 Security

- All environment variables properly configured
- CORS protection enabled
- Helmet.js security headers
- JWT token authentication
- Rate limiting configured
- Audit trail for all actions

See [DEPENDENCIES.md](./DEPENDENCIES.md) for security vulnerability information.

## 📄 License



---

**Built for Michigan ESTA compliance**
