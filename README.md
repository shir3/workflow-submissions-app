# 🚀 Wix Workflow Submissions App

A modern React application for managing and reviewing Wix workflow submissions with an integrated diff viewer and approval system.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## 🎯 Overview

This application provides a comprehensive interface for reviewing, comparing, and approving Wix workflow submissions. It consists of a React frontend with a modern UI design, a Node.js proxy server for secure API communication with Wix services, and an embedded iframe viewer for detailed diff analysis.

### Key Components

- **React Frontend**: Modern submissions table with search, filtering, and status management
- **Proxy Server**: Secure intermediary for Wix API communication with environment variable configuration
- **Iframe Diff Viewer**: Interactive diff comparison tool with approval workflow
- **Vercel Deployment**: Production-ready deployment configuration

## ✨ Features

### Submissions Management
- 📊 **Modern Table UI** - Clean, responsive design with search and filter capabilities
- 👤 **User Management** - Display user information with avatars and email contacts
- 🔗 **URL Management** - Direct links to published and edited versions
- 🔄 **Real-time Status** - Dynamic status badges and loading states

### Diff Review System
- 🎨 **Visual Diff Viewer** - Side-by-side comparison of changes
- 📝 **Multi-type Diffs** - Support for editor, SEO, and theme diffs
- 🔍 **Detailed Analysis** - Comprehensive change tracking and metadata
- ✅ **Approval Workflow** - Integrated approval and rejection system

### Security & Performance
- 🔐 **Environment Variables** - Secure credential management
- 🚀 **Production Optimized** - Built for performance and scalability
- 🌐 **CORS Configured** - Proper cross-origin resource sharing
- 📱 **Responsive Design** - Mobile-friendly interface

## 🏗 Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │────│   Proxy Server   │────│   Wix APIs      │
│   (Frontend)    │    │   (Backend)      │    │   (External)    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │
         │              ┌────────────────┐
         └──────────────│ Iframe Viewer  │
                        │ (Diff Review)  │
                        └────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/shir3/workflow-submissions-app.git
   cd workflow-submissions-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.production.template .env.local
   ```

4. **Configure your environment variables** (see [Environment Setup](#environment-setup))

5. **Start the development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run server  # Backend proxy server
   npm start       # Frontend React app
   ```

## 🔧 Environment Setup

Create a `.env.local` file in the project root with the following variables:

```env
# Wix API Configuration
WIX_ACCOUNT_ID=your_wix_account_id
WIX_AUTHORIZATION=your_wix_authorization_token
WIX_XSRF_TOKEN=your_xsrf_token

# Legacy React App Variables (if needed)
REACT_APP_API_BASE_URL=http://localhost:3001
```

### Environment Variable Details

| Variable | Description | Required |
|----------|-------------|----------|
| `WIX_ACCOUNT_ID` | Your Wix account identifier | ✅ |
| `WIX_AUTHORIZATION` | Wix API authorization token | ✅ |
| `WIX_XSRF_TOKEN` | Cross-site request forgery token | ✅ |
| `REACT_APP_API_BASE_URL` | API base URL for development | ❌ |

## 💻 Development

### Available Scripts

| Command | Description |
|---------|--------------|
| `npm start` | Start React development server |
| `npm run server` | Start proxy server only |
| `npm run dev` | Start both servers concurrently |
| `npm run build` | Build production React app |
| `npm test` | Run test suite |

### Development Workflow

1. **Frontend Development**
   - React app runs on `http://localhost:3000`
   - Hot reload enabled for development
   - ESLint and Prettier configured

2. **Backend Development**
   - Proxy server runs on `http://localhost:3001`
   - Automatic restart with nodemon (if configured)
   - Detailed logging for API requests

3. **Testing the Integration**
   - Ensure both servers are running
   - Test API endpoints via frontend
   - Verify iframe functionality

## 🌐 Deployment

The app is configured for deployment on **Vercel** with automatic builds and environment variable management.

### Vercel Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   Set the required environment variables in your Vercel dashboard:
   - `WIX_ACCOUNT_ID`
   - `WIX_AUTHORIZATION`
   - `WIX_XSRF_TOKEN`

### Deployment Configuration

The `vercel.json` file handles:
- Node.js 20.x runtime
- Proxy server as serverless function
- Static file serving for React build
- Proper routing configuration

## 📚 API Documentation

### Endpoints

#### Query Submissions
```http
POST /api/submissions/query
Content-Type: application/json

{
  "submission_id": "optional-submission-id"
}
```

#### Query Diffs
```http
POST /api/submissions/query-diffs
Content-Type: application/json

{
  "submission_id": "required-submission-id"
}
```

#### Approve Submission
```http
POST /api/submissions/approve
Content-Type: application/json

{
  "submission_id": "required-submission-id",
  "approver_user_email": "optional-approver-email"
}
```

### Response Formats

#### Submissions Response
```json
{
  "enrichedSubmissions": [
    {
      "id": "submission-id",
      "user_id": "user-id",
      "user_email": "user@example.com",
      "publishedUrl": "https://site.com",
      "editedUrl": "https://site.com?siteRevision=123",
      "metadata": { ... }
    }
  ]
}
```

#### Diffs Response
```json
{
  "diffs": {
    "editor_diffs": [...],
    "seo_diffs": [...],
    "theme_diffs": [...]
  }
}
```

## 📁 Project Structure

```
workflow-submissions-app/
├── public/                     # Static files
│   ├── iframe-poc.html        # Diff viewer interface
│   └── index.html             # Main HTML template
├── src/                       # React source code
│   ├── components/            # React components
│   │   ├── SubmissionsTable.js
│   │   └── SubmissionsTable.css
│   ├── services/             # API services
│   │   └── api.js
│   ├── App.js               # Main App component
│   ├── App.css              # App styles
│   └── index.js             # React entry point
├── server/                   # Backend proxy server
│   └── proxy-server.js      # Express.js server
├── build/                   # Production build (generated)
├── .env.local              # Environment variables (local)
├── .env.production.template # Environment template
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies and scripts
└── README.md              # This file
```

### Key Files

- **`src/components/SubmissionsTable.js`** - Main table component with modern UI
- **`src/services/api.js`** - API service layer for backend communication
- **`server/proxy-server.js`** - Express server for Wix API integration
- **`public/iframe-poc.html`** - Standalone diff viewer with React components
- **`vercel.json`** - Deployment configuration for Vercel platform

## 🤝 Contributing

### Development Guidelines

1. **Code Style**
   - Follow existing ESLint configuration
   - Use meaningful variable and function names
   - Add comments for complex logic

2. **Component Structure**
   - Keep components focused and reusable
   - Use CSS modules or styled-components
   - Implement proper error handling

3. **API Integration**
   - Always use environment variables for credentials
   - Implement proper error handling and logging
   - Follow RESTful conventions

### Git Workflow

1. Create feature branches from `main`
2. Use descriptive commit messages
3. Test thoroughly before submitting PRs
4. Update documentation as needed

## 🛠 Troubleshooting

### Common Issues

#### Environment Variables Not Loading
- Ensure `.env.local` is in project root
- Check variable names match exactly
- Restart development servers after changes

#### API Authentication Errors
- Verify Wix credentials are current
- Check token expiration dates
- Confirm account permissions

#### Build Failures
- Clear `node_modules` and reinstall
- Check for ESLint errors
- Verify all dependencies are compatible

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📄 License

This project is private and proprietary. All rights reserved.

## 🔗 Links

- [GitHub Repository](https://github.com/shir3/workflow-submissions-app)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Wix Developer Documentation](https://dev.wix.com/)

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Node.js:** 20.x  
**React:** 19.x
