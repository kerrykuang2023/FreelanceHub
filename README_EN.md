# JobPortal - SAP Consultant Freelance Platform

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7-green?logo=mongodb)](https://www.mongodb.com/)

**[🇨🇳 中文文档](README_ZH.md)**

---

A modern, multilingual recruitment platform connecting Freelancers, HR Recruiters, and Company Administrators. Built with React 18, TypeScript, Node.js, and MongoDB.

## 🌟 Key Features

### 🌐 Internationalization (i18n)
- **Multi-language Support**: Full support for Chinese (中文), English, and Japanese (日本語)
- **Dynamic Language Switching**: Real-time language switching without page refresh
- **Complete Translation Coverage**: All UI elements, menus, buttons, and messages are translated
- **Language Persistence**: User's language preference is saved in localStorage

### 👤 Freelancer Dashboard
- **Dashboard Overview**: Weekly hours, active projects, pending payments, pending applications
- **Project Management**: View active projects, project details, work logs
- **Job Browsing**: Browse and search jobs, apply for positions
- **Application Management**: View application status, application history
- **Work Log Management**: Submit work logs, view work statistics

### 👔 HR Recruiter Dashboard
- **Dashboard Overview**: Active jobs, pending work logs, received applications, monthly expenses
- **Job Posting**: Post new jobs, manage posted jobs
- **Application Review**: View applicant applications, review application status
- **Work Log Review**: Review work logs submitted by consultants

### 🔧 System Administrator Dashboard
- **Dashboard Overview**: Total users, freelancers, registered companies, pending invoices
- **User Management**: Manage user accounts, role permissions
- **Company Management**: Review company registrations, manage company information
- **System Configuration**: Manage skill categories, work types, tax rates, currencies, etc.
- **Data Statistics**: Project requirements, work logs, total invoices statistics

### 🔐 Authentication & Authorization
- **User Authentication**: Login/Register/Logout
- **Role-based Permissions**: Role-based Access Control (RBAC)
- **Dynamic Menu**: Display different menus based on user roles

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

> 📌 Click image to view full size

### 🎯 Feature Screenshots

#### 📋 Jobs List
[![Jobs List](docs/screenshots/readme/jobs-list-en.png)](docs/screenshots/readme/jobs-list-en.png)

#### 🌐 Chinese Dashboard
[![Chinese Dashboard](docs/screenshots/readme/freelancer-dashboard-zh.png)](docs/screenshots/readme/freelancer-dashboard-zh.png)

## 🛠️ Tech Stack

### Frontend
| Technology | Description |
|------------|-------------|
| **React 18** | Modern UI Framework with Hooks |
| **TypeScript** | Type-safe JavaScript development |
| **Tailwind CSS** | Utility-first CSS framework |
| **React Router v6** | Client-side routing |
| **React Query** | Server state management |
| **i18next** | Internationalization framework |

### Backend
| Technology | Description |
|------------|-------------|
| **Node.js** | JavaScript runtime |
| **Express** | Web framework |
| **MongoDB** | NoSQL database |
| **Mongoose** | MongoDB object modeling |
| **JWT** | JSON Web Token authentication |
| **Passport.js** | Authentication middleware |

### Dev Tools
| Tool | Description |
|------|-------------|
| **Docker** | Containerization |
| **Playwright** | E2E testing |
| **Vite** | Frontend build tool |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 4.4+
- Docker (Optional)

### Using Docker (Recommended)

```bash
# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:5137
# Backend API: http://localhost:5555/api/v1
```

### Manual Start

```bash
# Backend
cd JobPortal/server
npm install
npm run dev

# Frontend (in another terminal)
cd JobPortal/client
npm install
npm run dev
```

## 📝 Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Freelancer | freelancer@test.com | Test123456! |
| HR Recruiter | hr@test.com | Test123456! |
| Admin | admin@test.com | Test123456! |
| Super Admin | admin@jobportal.com | Admin@123 |

## 🧪 Testing

```bash
# Run i18n language switching tests
npx playwright test e2e-tests/i18n-language-switch.spec.ts --headed

# Run cross-role E2E tests
npx playwright test e2e-tests/cross-role-e2e.spec.ts --headed

# Run dashboard data validation
npx playwright test e2e-tests/dashboard-data.spec.ts --headed
```

## 📁 Project Structure

```
JobPortal/
├── JobPortal/
│   ├── client/                    # Frontend Code
│   │   └── src/
│   │       ├── components/        # React Components
│   │       ├── pages/             # Page Components
│   │       ├── services/          # API Services
│   │       ├── hooks/             # Custom Hooks
│   │       ├── i18n/              # Internationalization
│   │       │   └── locales/       # Translation Files
│   │       │       ├── zh/        # Chinese
│   │       │       ├── en/        # English
│   │       │       └── ja/        # Japanese
│   │       └── providers/         # Context Providers
│   └── server/                    # Backend Code
│       └── src/
│           ├── controllers/       # Route Controllers
│           ├── models/            # Data Models
│           ├── routes/            # API Routes
│           └── middlewares/       # Express Middlewares
├── e2e-tests/                     # E2E Test Files
├── docs/                          # Documentation
└── docker-compose.yml
```

## 🔄 Recent Updates

### 2026-03-30
- 🌐 **Major i18n Update**: Complete internationalization for all pages
  - Added translation support for Chinese, English, and Japanese
  - Updated all dashboard pages with full translation coverage
  - Added language switcher component
  - Created comprehensive E2E tests for i18n verification

### 2026-03-28
- 🐛 Fixed StorageService JSON parsing error
- 🐛 Fixed AuthProvider data parsing error
- ✨ Added cross-role E2E tests
- ✨ Optimized dashboard data loading

## 🤝 Contributing

1. Fork this project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License

---

<p align="center">
  <b>Created</b>: 2026-03-19 &nbsp;|&nbsp; 
  <b>Last Updated</b>: 2026-03-30 &nbsp;|&nbsp; 
  <b>Version</b>: 1.1.0
</p>
