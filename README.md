# JobPortal - SAP Consultant Freelance Platform

<p align="center">
  <a href="README_ZH.md"><b>🇨🇳 切换到中文</b></a>
</p>

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)](https://www.mongodb.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green?logo=node.js)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://www.docker.com/)

---

## 📖 Table of Contents

- [Overview](#overview)
- [Key Features](#-key-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

<a name="overview"></a>
## Overview

**JobPortal** is a modern, enterprise-grade recruitment platform designed specifically for SAP consultants and freelance professionals. It provides a seamless connection between Freelancers, HR Recruiters, and Company Administrators through an intuitive, multilingual interface.

### Why JobPortal?

| Challenge | Solution |
|-----------|----------|
| 🔍 **Finding SAP talent is difficult** | Specialized platform for SAP consultants |
| 🌍 **Language barriers** | Full i18n support (Chinese, English, Japanese) |
| 📊 **Complex project management** | Integrated work logs, invoices, and payments |
| 🔐 **Security concerns** | Role-based access control (RBAC) |
| 📱 **Mobile accessibility** | Responsive design for all devices |

---

<a name="-key-features"></a>
## 🌟 Key Features

### 🌐 Internationalization (i18n)

| Feature | Description |
|---------|-------------|
| **Multi-language Support** | Full support for Chinese (中文), English, and Japanese (日本語) |
| **Dynamic Language Switching** | Real-time language switching without page refresh |
| **Complete Translation Coverage** | All UI elements, menus, buttons, and messages are translated |
| **Language Persistence** | User's language preference is saved in localStorage |
| **Extensible** | Easy to add more languages |

### 👤 Freelancer Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Dashboard Overview                                       │
├─────────────────────────────────────────────────────────────┤
│  ⏱️ Weekly Hours    📁 Active Projects                       │
│  💰 Pending Payments  📬 Pending Applications                │
├─────────────────────────────────────────────────────────────┤
│  📋 Project Management                                       │
│  ├── View active projects                                    │
│  ├── Project details & milestones                            │
│  └── Work log tracking                                       │
├─────────────────────────────────────────────────────────────┤
│  💼 Job Browsing & Applications                              │
│  ├── Search and filter jobs                                  │
│  ├── Apply for positions                                     │
│  └── Track application status                                │
├─────────────────────────────────────────────────────────────┤
│  ⏱️ Work Log Management                                      │
│  ├── Submit daily/weekly work logs                           │
│  ├── View work statistics                                    │
│  └── Export reports                                          │
└─────────────────────────────────────────────────────────────┘
```

### 👔 HR Recruiter Dashboard

| Feature | Description |
|---------|-------------|
| **Dashboard Overview** | Active jobs, pending work logs, received applications, monthly expenses |
| **Job Posting** | Create, edit, and manage job postings with rich text editor |
| **Application Review** | Review applicant profiles, skills, and work history |
| **Work Log Approval** | Approve or reject consultant work logs with comments |
| **Team Management** | Manage team members and permissions |

### 🔧 System Administrator Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  📊 System Overview                                          │
├─────────────────────────────────────────────────────────────┤
│  👥 Total Users    🏢 Registered Companies                   │
│  📋 Total Projects  💰 Total Invoices                        │
├─────────────────────────────────────────────────────────────┤
│  👤 User Management                                          │
│  ├── User accounts CRUD                                      │
│  ├── Role assignment                                         │
│  └── Permission management                                   │
├─────────────────────────────────────────────────────────────┤
│  🏢 Company Management                                       │
│  ├── Company registration review                             │
│  ├── Verification workflow                                   │
│  └── Company profile management                              │
├─────────────────────────────────────────────────────────────┤
│  ⚙️ System Configuration                                     │
│  ├── Skill categories (SAP, ERP, CRM, etc.)                  │
│  ├── Work types (Remote, On-site, Hybrid)                    │
│  ├── Tax rates & Currencies                                  │
│  └── Language requirements                                   │
└─────────────────────────────────────────────────────────────┘
```

### 🔐 Authentication & Authorization

| Feature | Implementation |
|---------|---------------|
| **User Authentication** | JWT-based authentication with refresh tokens |
| **Role-based Access Control** | Multi-role support (Freelancer, HR, Admin) |
| **Dynamic Menu** | Role-specific navigation and features |
| **Session Management** | Secure session handling with auto-logout |
| **Password Security** | Bcrypt hashing with salt rounds |

---

<a name="-screenshots"></a>
## 📸 Screenshots

### 🔐 Login Page - Multi-language Support

| Chinese (中文) | English | Japanese (日本語) |
|:--------------:|:-------:|:-----------------:|
| [![Login ZH](docs/screenshots/readme/login-zh.png)](docs/screenshots/readme/login-zh.png) | [![Login EN](docs/screenshots/readme/login-en.png)](docs/screenshots/readme/login-en.png) | [![Login JA](docs/screenshots/readme/login-ja.png)](docs/screenshots/readme/login-ja.png) |

> 📌 Click image to view full size

### 📊 Dashboard Views

| Freelancer Dashboard | Admin Dashboard |
|:--------------------:|:---------------:|
| [![Freelancer Dashboard](docs/screenshots/readme/freelancer-dashboard-en.png)](docs/screenshots/readme/freelancer-dashboard-en.png) | [![Admin Dashboard](docs/screenshots/readme/admin-dashboard-en.png)](docs/screenshots/readme/admin-dashboard-en.png) |

### 🎯 Feature Highlights

| Jobs List | Chinese Dashboard |
|:---------:|:-----------------:|
| [![Jobs List](docs/screenshots/readme/jobs-list-en.png)](docs/screenshots/readme/jobs-list-en.png) | [![Chinese Dashboard](docs/screenshots/readme/freelancer-dashboard-zh.png)](docs/screenshots/readme/freelancer-dashboard-zh.png) |

---

<a name="-tech-stack"></a>
## 🛠️ Tech Stack

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Stack                        │
├─────────────────────────────────────────────────────────────┤
│  Framework        │ React 18 with TypeScript                │
│  State Management │ React Query + Context API               │
│  Styling          │ Tailwind CSS + CSS Modules              │
│  Routing          │ React Router v6                         │
│  i18n             │ i18next + react-i18next                 │
│  HTTP Client      │ Axios with interceptors                 │
│  Build Tool       │ Vite                                    │
│  Testing          │ Playwright (E2E) + Vitest (Unit)        │
└─────────────────────────────────────────────────────────────┘
```

### Backend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Backend Stack                         │
├─────────────────────────────────────────────────────────────┤
│  Runtime          │ Node.js 18+                             │
│  Framework        │ Express.js                              │
│  Database         │ MongoDB 7 with Mongoose ODM             │
│  Authentication   │ JWT + Passport.js                       │
│  Validation       │ Joi / express-validator                 │
│  File Upload      │ Multer                                  │
│  API Docs         │ Swagger / OpenAPI                       │
└─────────────────────────────────────────────────────────────┘
```

### DevOps & Tools

| Tool | Purpose |
|------|---------|
| **Docker** | Containerization for consistent environments |
| **Docker Compose** | Multi-container orchestration |
| **Playwright** | End-to-end testing |
| **ESLint** | Code linting and formatting |
| **Prettier** | Code formatting |
| **Husky** | Git hooks for pre-commit checks |

---

<a name="-quick-start"></a>
## 🚀 Quick Start

### Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| Node.js | 18+ | `node --version` |
| MongoDB | 4.4+ | `mongod --version` |
| Docker | 20+ | `docker --version` |
| npm | 9+ | `npm --version` |

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/kerrykuang2023/JobPortal.git
cd JobPortal

# Build and start all services
docker compose up --build -d

# Check container health
docker compose ps

# Access the application
# Frontend: http://localhost:5137
# Backend API: http://localhost:5555/api/v1
# Backend health: http://localhost:5555/health
```

See [Docker Deployment Guide](docs/DOCKER-DEPLOYMENT-GUIDE.md) for environment variables, health checks, troubleshooting, and the verified local deployment notes.

### Option 2: Manual Setup

```bash
# 1. Clone and setup backend
git clone https://github.com/kerrykuang2023/JobPortal.git
cd JobPortal/JobPortal/server
npm install
cp .env.example .env
npm run dev

# 2. Setup frontend (new terminal)
cd JobPortal/JobPortal/client
npm install
cp .env.example .env
npm run dev
```

### Test Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Freelancer | freelancer@test.com | Test123456! | Job browsing, applications, work logs |
| HR Recruiter | hr@test.com | Test123456! | Job posting, application review |
| Admin | admin@test.com | Test123456! | Full system access |
| Super Admin | admin@jobportal.com | Admin@123 | System configuration |

---

<a name="-project-structure"></a>
## 📁 Project Structure

```
JobPortal/
├── 📁 JobPortal/
│   ├── 📁 client/                    # Frontend Application
│   │   ├── 📁 src/
│   │   │   ├── 📁 components/        # Reusable UI Components
│   │   │   │   ├── 📁 common/        # Common components (Button, Modal, etc.)
│   │   │   │   ├── 📁 core-ui/       # Core UI components
│   │   │   │   ├── 📁 forms/         # Form components
│   │   │   │   ├── 📁 layouts/       # Layout components
│   │   │   │   └── 📁 navigation/    # Navigation components
│   │   │   ├── 📁 pages/             # Page Components
│   │   │   │   ├── 📁 AuthPages/     # Login, Register, etc.
│   │   │   │   ├── 📁 Dashboard/     # Dashboard pages
│   │   │   │   └── 📁 Admin/         # Admin pages
│   │   │   ├── 📁 services/          # API Service Layer
│   │   │   ├── 📁 hooks/             # Custom React Hooks
│   │   │   ├── 📁 i18n/              # Internationalization
│   │   │   │   └── 📁 locales/       # Translation files
│   │   │   │       ├── 📁 zh/        # Chinese translations
│   │   │   ├── 📁 providers/         # React Context Providers
│   │   │   ├── 📁 interfaces/        # TypeScript Interfaces
│   │   │   └── 📁 utils/             # Utility Functions
│   │   ├── 📄 package.json
│   │   └── 📄 vite.config.ts
│   │
│   └── 📁 server/                    # Backend Application
│       ├── 📁 src/
│       │   ├── 📁 controllers/       # Route Controllers
│       │   ├── 📁 models/            # Mongoose Models
│       │   ├── 📁 routes/            # API Routes
│       │   ├── 📁 middlewares/       # Express Middlewares
│       │   ├── 📁 services/          # Business Logic
│       │   ├── 📁 validators/        # Request Validation
│       │   └── 📁 utils/             # Utility Functions
│       ├── 📄 package.json
│       └── 📄 tsconfig.json
│
├── 📁 e2e-tests/                     # End-to-End Tests
│   ├── 📄 i18n-language-switch.spec.ts
│   ├── 📄 cross-role-e2e.spec.ts
│   └── 📄 dashboard-data.spec.ts
│
├── 📁 docs/                          # Documentation
│   └── 📁 screenshots/               # Screenshots
│
├── 📄 README.md                      # English Documentation
├── 📄 README_ZH.md                   # Chinese Documentation
├── 📄 docker-compose.yml             # Docker Configuration
└── 📄 package.json                   # Root package.json
```

---

<a name="-api-documentation"></a>
## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/logout` | User logout |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| GET | `/api/v1/auth/me` | Get current user |

### Job Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/v1/jobs` | List all jobs | All |
| GET | `/api/v1/jobs/:id` | Get job details | All |
| POST | `/api/v1/jobs` | Create new job | HR, Admin |
| PUT | `/api/v1/jobs/:id` | Update job | HR, Admin |
| DELETE | `/api/v1/jobs/:id` | Delete job | Admin |

### Work Log Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/v1/work-logs` | List work logs | All |
| POST | `/api/v1/work-logs` | Create work log | Freelancer |
| PUT | `/api/v1/work-logs/:id/confirm` | Confirm work log | HR |
| PUT | `/api/v1/work-logs/:id/reject` | Reject work log | HR |

### Admin Endpoints

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/v1/admin/users` | List all users | Admin |
| GET | `/api/v1/admin/companies` | List all companies | Admin |
| PUT | `/api/v1/admin/companies/:id/verify` | Verify company | Admin |
| GET | `/api/v1/admin/config/:type` | Get system config | Admin |

---

<a name="-testing"></a>
## 🧪 Testing

### Run E2E Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e-tests/i18n-language-switch.spec.ts --headed

# Run with UI mode
npx playwright test --ui

# Generate test report
npx playwright show-report
```

### Test Coverage

| Test Suite | Coverage | Description |
|------------|----------|-------------|
| i18n Tests | 15 tests | Multi-language switching verification |
| Cross-role Tests | 20+ tests | Role-based access control |
| Dashboard Tests | 10+ tests | Data display and interactions |
| Auth Tests | 10+ tests | Authentication flows |

---

<a name="-roadmap"></a>
## 🗺️ Roadmap

### v1.1.0 (Current)
- [x] Multi-language support (Chinese, English, Japanese)
- [x] Freelancer dashboard
- [x] HR dashboard
- [x] Admin dashboard
- [x] Work log management
- [x] Invoice management

### v1.2.0 (Planned)
- [ ] Real-time notifications
- [ ] Video interview integration
- [ ] Advanced search with filters
- [ ] Mobile app (React Native)

### v2.0.0 (Future)
- [ ] AI-powered job matching
- [ ] Blockchain-based contracts
- [ ] Multi-tenant architecture
- [ ] Advanced analytics dashboard

---

<a name="-contributing"></a>
## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Keep PRs focused and small

---

<a name="-license"></a>
## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact & Support

| Type | Link |
|------|------|
| 📧 Email | support@jobportal.com |
| 🐛 Issues | [GitHub Issues](https://github.com/kerrykuang2023/JobPortal/issues) |
| 💬 Discussions | [GitHub Discussions](https://github.com/kerrykuang2023/JobPortal/discussions) |

---

<p align="center">
  <b>Created:</b> 2026-03-19 &nbsp;|&nbsp; 
  <b>Last Updated:</b> 2026-03-30 &nbsp;|&nbsp; 
  <b>Version:</b> 1.1.0
</p>

<p align="center">
  <a href="README_ZH.md"><b>🇨🇳 切换到中文</b></a>
</p>
