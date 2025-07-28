# Point of Sale (POS) System

## Overview

This is a modern Point of Sale (POS) system built with React/TypeScript frontend and Express.js backend, using Drizzle ORM with PostgreSQL for data persistence. The application features a responsive design optimized for retail environments, with support for product management, cart functionality, and transaction processing.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom POS-themed color scheme
- **State Management**: React hooks with custom cart management logic
- **Data Fetching**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Session Storage**: PostgreSQL session store using connect-pg-simple
- **Build Process**: ESBuild for server-side bundling

### Data Storage
- **Primary Database**: PostgreSQL via Neon Database serverless connection
- **ORM**: Drizzle ORM with schema-first approach
- **Migration Management**: Drizzle Kit for database migrations
- **Schema Location**: `shared/schema.ts` for type sharing between client/server
- **Fallback Storage**: In-memory storage implementation for development/testing

## Key Components

### Database Schema
- **Products Table**: Stores product information (name, description, price, category, stock, image URL)
- **Transactions Table**: Records completed sales with items (JSONB), totals, payment method, and timestamps
- **Schema Validation**: Zod schemas generated from Drizzle tables for runtime validation

### Frontend Components
- **POS Interface**: Main sales interface with product grid and cart sidebar
- **Product Grid**: Displays products with category filtering and search functionality
- **Cart Sidebar**: Manages cart items with quantity controls and checkout flow
- **Receipt Modal**: Displays transaction receipts with print/email options
- **Responsive Design**: Mobile-first approach with collapsible sidebars

### Backend API Routes
- **Products API**: GET /api/products (with category/search filtering), GET /api/products/:id
- **Transactions API**: POST /api/transactions for checkout processing
- **Stock Management**: Automatic inventory updates during transactions

### Cart Management
- **Local State**: Custom React hook managing cart items and calculations
- **Tax Calculation**: Configurable tax rate (8.5% default)
- **Payment Methods**: Support for cash and card payments
- **Real-time Updates**: Immediate UI updates with server synchronization

## Data Flow

1. **Product Display**: Frontend fetches products from `/api/products` with optional filtering
2. **Cart Operations**: Local state management with immediate UI updates
3. **Checkout Process**: Cart data sent to `/api/transactions` endpoint
4. **Stock Updates**: Server updates product inventory during transaction processing
5. **Receipt Generation**: Transaction data returned for receipt display
6. **Cache Invalidation**: React Query cache updated after successful transactions

## External Dependencies

### UI/UX Libraries
- **Radix UI**: Headless UI components for accessibility and functionality
- **Tailwind CSS**: Utility-first CSS framework with custom POS theme
- **Lucide React**: Icon library for consistent iconography
- **shadcn/ui**: Pre-built component library with consistent design system

### Development Tools
- **Replit Integration**: Custom plugins for development environment
- **TypeScript**: Full type safety across client and server
- **ESLint/Prettier**: Code quality and formatting (implied by modern setup)

### Database & Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Drizzle Kit**: Database migration and introspection tools

## Deployment Strategy

### Development Environment
- **Vite Dev Server**: Hot module replacement for frontend development
- **Express Server**: Serves API routes and static files in production
- **Database Migrations**: Manual execution via `npm run db:push`
- **Environment Variables**: DATABASE_URL required for database connection

### Production Build
- **Frontend Build**: Vite builds React app to `dist/public`
- **Backend Build**: ESBuild bundles server code to `dist/index.js`
- **Static File Serving**: Express serves built frontend files
- **Single Port Deployment**: Backend serves both API and frontend routes

### Configuration Management
- **Shared Types**: TypeScript types shared between client/server via `shared/` directory
- **Path Aliases**: Configured for clean imports (`@/`, `@shared/`)
- **Build Scripts**: Separate development and production build processes
- **Database Setup**: Drizzle migrations handle schema deployment

The application is designed as a full-stack monorepo with clear separation between client and server code, while maintaining shared type safety and efficient development workflows.