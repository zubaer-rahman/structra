# 📁 BuildReady Project Structure

## 🏗️ **Root Directory (Clean & Organized)**

```
buildready/
├── 📁 app/                          # Next.js 15 App Router
├── 📁 components/                   # Reusable UI components
├── 📁 contexts/                     # React contexts
├── 📁 database/                     # Database migrations
├── 📁 lib/                          # Utilities and configuration
├── 📁 public/                       # Static assets
├── 📁 server/                       # TRPC server
├── 📁 types/                        # TypeScript types
├── 📄 .env.example                  # Environment template
├── 📄 .gitignore                    # Git ignore rules
├── 📄 ARCHITECTURE.md               # Architecture documentation
├── 📄 components.json               # shadcn/ui configuration
├── 📄 eslint.config.mjs             # ESLint configuration
├── 📄 next.config.ts                # Next.js configuration
├── 📄 package.json                  # Dependencies and scripts
├── 📄 postcss.config.mjs            # PostCSS configuration
├── 📄 PROJECT_STRUCTURE.md          # This file
├── 📄 README.md                     # Project overview
├── 📄 tsconfig.json                 # TypeScript configuration
└── 📄 vercel.json                   # Vercel deployment config
```

## 🗂️ **Key Directories Explained**

### **`/app`** - Next.js App Router
- **API Routes**: `/api/trpc/[trpc]/route.ts`
- **Page Routes**: Authentication, Dashboard, Home
- **Layouts**: Root layout, Auth layout, Dashboard layout

### **`/components`** - UI Components
- **`/features`**: Feature-specific components
- **`/shared`**: Reusable components (UserMenu, Navbar)
- **`/ui`**: Base UI components (Button, Card, Input)

### **`/lib`** - Utilities & Configuration
- **`/config`**: Environment and app configuration
- **`/database`**: Database utilities and migrations
- **`/testing`**: Testing infrastructure setup

### **`/database`** - Database Management
- **`/migrations`**: SQL migration files
- **Version Control**: Tracked migration history
- **CLI Tools**: Migration management commands

### **`/server`** - Backend API
- **`/api`**: TRPC API routers
- **Routers**: Auth, Projects, Proposals, Users, Messages

## 🔧 **Configuration Files**

### **Environment Configuration**
- **`.env.example`**: Template for environment variables
- **`lib/config/index.ts`**: Type-safe configuration management

### **Build Configuration**
- **`next.config.ts`**: Next.js configuration
- **`tsconfig.json`**: TypeScript paths and settings
- **`postcss.config.mjs`**: CSS processing configuration

### **Code Quality**
- **`eslint.config.mjs`**: Linting rules and configuration
- **`components.json`**: shadcn/ui component configuration

## 📚 **Documentation Files**

- **`README.md`**: Project overview and getting started
- **`ARCHITECTURE.md`**: Detailed architecture documentation
- **`PROJECT_STRUCTURE.md`**: This file - project organization

## 🚀 **Getting Started**

1. **Copy environment template**: `cp .env.example .env.local`
2. **Install dependencies**: `pnpm install`
3. **Run migrations**: `pnpm db:migrate migrate`
4. **Start development**: `pnpm dev`

## 🎯 **Key Benefits of This Structure**

- **🧹 Clean Root**: No unnecessary files cluttering the root
- **📁 Organized**: Logical grouping of related files
- **🔧 Maintainable**: Easy to find and modify files
- **📚 Documented**: Clear understanding of project organization
- **🚀 Scalable**: Structure supports growth and new features

---

**This structure follows modern Next.js 15 best practices and keeps your project organized and maintainable.**
