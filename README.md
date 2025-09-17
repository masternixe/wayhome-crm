# Wayhome Real Estate CRM

A comprehensive multi-office real estate CRM system with public property listings, built with Next.js, Express.js, and PostgreSQL.

## 🏗️ Architecture

- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS
- **Backend**: Express.js with TypeScript, Prisma ORM
- **Database**: PostgreSQL with full-text search
- **Cache & Jobs**: Redis with BullMQ for background jobs
- **Payments**: Stripe for property promotion
- **Authentication**: JWT-based auth with role-based access control
- **Email**: Nodemailer with template system
- **File Uploads**: AWS S3 or local storage

## 🚀 Features

### Multi-Office & Role Management
- **SUPER_ADMIN**: Global settings, all offices, commission policy, analytics
- **OFFICE_ADMIN**: Manages agents/properties/leads/deals for their office
- **MANAGER**: Supervises team, approves collaborations, sets agent targets
- **AGENT**: Owns assigned assets, CRUD operations where permitted
- **PUBLIC_USER**: Can self-list properties and pay to promote via Stripe

### Core Features
- Property management with advanced search and filters
- Lead & opportunity pipeline management
- Commission calculation and points system
- Property promotion with Stripe integration (Top-10 leaderboard)
- Email notifications and daily digests
- Comprehensive analytics and reporting
- Public website with property listings
- Mobile-responsive design

### Public Website Features
- Hero search by city & address
- Featured properties section
- Agent directory with "Agent of the Month"
- Property detail pages with inquiry forms
- Job applications with CV upload
- Public user property listing flow
- Stripe-powered property promotion

## 📦 Project Structure

```
crm/
├── apps/
│   ├── api/                 # Express.js API server
│   │   ├── src/
│   │   │   ├── controllers/ # Route controllers
│   │   │   ├── services/    # Business logic services
│   │   │   ├── middleware/  # Auth & validation middleware
│   │   │   ├── routes/      # API routes
│   │   │   ├── workers/     # Background job workers
│   │   │   └── scripts/     # Database seeding scripts
│   │   └── tests/           # API tests
│   └── web/                 # Next.js web application
│       ├── src/
│       │   ├── app/         # App router pages
│       │   ├── components/  # React components
│       │   ├── hooks/       # Custom React hooks
│       │   └── lib/         # Utility libraries
│       └── public/          # Static assets
├── packages/
│   ├── database/           # Prisma schema & migrations
│   └── shared/            # Shared types & utilities
└── scripts/               # Deployment & utility scripts
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 14+
- Redis 6+
- Stripe account (for payments)
- SMTP email service (for notifications)

### Quick Start

1. **Clone and install dependencies**
```bash
git clone <repository-url>
cd crm
npm install
```

2. **Set up environment variables**
```bash
# Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit the .env files with your configuration
```

3. **Set up the database**
```bash
# Create PostgreSQL database
createdb wayhome_crm

# Generate Prisma client and run migrations
npm run db:migrate

# Seed the database with sample data
npm run seed
```

4. **Start development servers**
```bash
# Start all services (API + Web)
npm run dev

# Or start individually:
npm run dev:api   # API server on http://localhost:4001
npm run dev:web   # Web app on http://localhost:4000
```

### Environment Configuration

#### Root `.env`
```env
DATABASE_URL="postgresql://username:password@localhost:5432/wayhome_crm"
REDIS_URL="redis://localhost:6379"
```

#### API `.env` (`apps/api/.env`)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/wayhome_crm"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (generate strong secrets in production)
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
FROM_EMAIL="noreply@wayhome.com"

# AWS S3 (optional, for file uploads)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="eu-central-1"
AWS_S3_BUCKET="wayhome-uploads"

# Currency Exchange Rates
EUR_TO_ALL_RATE="100"
ALL_TO_EUR_RATE="0.01"

# URLs
WEB_URL="http://localhost:4000"
CRM_URL="http://localhost:4000/crm"
API_URL="http://localhost:4001"

# Security
NODE_ENV="development"
```

#### Web `.env` (`apps/web/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:4001/api/v1"
NEXT_PUBLIC_WEB_URL="http://localhost:4000"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Optional
GOOGLE_SITE_VERIFICATION="your-google-verification-code"
```

## 🗃️ Database Setup

The application uses PostgreSQL with Prisma ORM. The database includes:

- Multi-tenant architecture with offices and brands
- Full-text search capabilities with trigram indexing
- Comprehensive audit logging
- Points and gamification system
- Stripe payment integration tables

### Running Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Reset database (development only)
npm run db:reset

# View database in Prisma Studio
npm run db:studio
```

### Seeding Data

The seed script creates realistic sample data including:

- 1 Super Admin, 2 Office Admins, 2 Managers, 5 Agents
- 2 Offices (Tirana, Durrës) 
- 20 Clients, 50 Properties, 30 Leads
- 20 Opportunities, 15 Transactions
- Sample tasks, comments, and points
- 10 Public users with property listings
- Featured property bidding slots

```bash
npm run seed
```

### Login Credentials (After Seeding)

- **Super Admin**: `admin@wayhome.com` / `password123`
- **Office Admin**: `admin.tirana@wayhome.com` / `password123`
- **Manager**: `manager.tirana@wayhome.com` / `password123`
- **Agent**: `agent1@wayhome.com` / `password123`
- **Public User**: `public.user1@example.com` / `password123`

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:api          # Start API server only
npm run dev:web          # Start web app only

# Building
npm run build           # Build all applications
npm run start           # Start production servers

# Database
npm run db:migrate      # Run Prisma migrations
npm run db:push         # Push schema changes
npm run db:studio       # Open Prisma Studio
npm run seed            # Seed database with sample data

# Testing
npm run test            # Run all tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage

# Code Quality
npm run lint            # Lint all code
npm run type-check      # TypeScript type checking
```

### API Documentation

- **Swagger UI**: http://localhost:4001/api-docs
- **Health Check**: http://localhost:4001/health
- **API Base**: http://localhost:4001/api/v1

### Key API Endpoints

```bash
# Authentication
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh

# Properties
GET  /api/v1/properties
POST /api/v1/properties
GET  /api/v1/properties/:id
PATCH /api/v1/properties/:id

# Leads & Opportunities
GET  /api/v1/leads
POST /api/v1/leads
POST /api/v1/leads/:id/convert

# Global Search
GET  /api/v1/search?q=query

# Public Endpoints
GET  /api/v1/public/properties
POST /api/v1/public/listings
POST /api/v1/public/listings/:id/promote
GET  /api/v1/public/featured-slots

# Stripe Webhook
POST /api/v1/webhooks/stripe
```

## 🎨 Frontend Development

The frontend is built with Next.js 14 (App Router) and includes:

- **Public Website**: Property search, agent directory, job applications
- **CRM Dashboard**: Internal management system for agents and admins
- **Responsive Design**: Mobile-first with Tailwind CSS
- **Components**: Reusable UI components with TypeScript
- **State Management**: Zustand for global state
- **API Integration**: React Query for data fetching

### Key Pages

- `/` - Homepage with hero search
- `/pronat` - Property listings with filters
- `/pronat/[id]` - Property detail page
- `/agjentet` - Agent directory
- `/crm/dashboard` - CRM dashboard
- `/crm/properties` - Property management
- `/crm/leads` - Lead management
- `/list-your-home` - Public property listing

## 🔐 Authentication & Security

- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation with Zod schemas
- SQL injection protection with Prisma
- CORS configuration
- Helmet.js security headers

## 📧 Email System

The application includes a comprehensive email system:

- **Task Reminders**: Automated reminders for due tasks
- **Daily Digest**: Morning summary for agents (8:00 AM)
- **Welcome Emails**: New user onboarding
- **Password Reset**: Secure password reset flow
- **Email Verification**: Public user email verification

## 💳 Stripe Integration

Property promotion system with Stripe:

- **Checkout Sessions**: Secure payment processing
- **Webhooks**: Automated slot creation on successful payment
- **Top-10 Leaderboard**: Featured properties by bid amount
- **Automatic Expiry**: Time-based slot expiration
- **Analytics**: Revenue and promotion analytics

## 📊 Analytics & Reporting

- Agent performance dashboards
- Office-wide analytics
- Lead conversion funnels
- Revenue tracking by type/location
- Property view analytics
- Points leaderboards
- Export capabilities (PDF/Excel)

## 🌐 Internationalization

The application supports English and Albanian:

- Albanian UI terms as specified
- Currency support (EUR/ALL)
- Localized date/time formats
- Multi-language content management

## 🚀 Production Deployment

### Using Docker (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale api=2
```

### Manual Deployment

1. **Build the applications**
```bash
npm run build
```

2. **Set up production database**
```bash
npm run db:migrate:deploy
```

3. **Start the services**
```bash
npm start
```

### Environment Variables (Production)

Ensure you set production values for:
- Strong JWT secrets
- Production database URL
- Redis connection string
- Stripe live API keys
- SMTP credentials
- AWS S3 configuration
- Proper CORS origins

## 🧪 Testing

The project includes comprehensive testing:

```bash
# Run all tests
npm run test

# API unit tests
npm run test --workspace=@wayhome/api

# Frontend component tests
npm run test --workspace=@wayhome/web

# E2E tests (if implemented)
npm run test:e2e
```

Test coverage includes:
- Commission calculation logic
- Points system functionality
- Authentication flows
- API endpoint validation
- Component rendering
- Database operations

## 📝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@wayhome.com or create an issue in this repository.

## 🙏 Acknowledgments

- Next.js team for the excellent React framework
- Prisma team for the fantastic ORM
- Tailwind CSS for the utility-first CSS framework
- Stripe for payment processing infrastructure
- All open-source contributors who made this possible

---

**Built with ❤️ for the Albanian real estate market**
