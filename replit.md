# Laundry Management System

## Overview

This is a modern laundry management system built with React/TypeScript frontend and Express.js backend, using Drizzle ORM with PostgreSQL for data persistence. The application features a responsive design optimized for laundry service environments, with support for clothing item selection, service management, cart functionality, and transaction processing. Customers can select clothing items (pants, dishdashas, shirts, etc.) and choose from various laundry services (wash & fold, dry cleaning, express service, etc.).

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
- **Clothing Items Table**: Stores clothing item information (name, description, category, image URL) - no pricing as services determine cost
- **Laundry Services Table**: Stores available services (name, description, price, category) - wash & fold, dry cleaning, ironing, etc.
- **Transactions Table**: Records completed orders with items (JSONB), totals, payment method, and timestamps
- **Schema Validation**: Zod schemas generated from Drizzle tables for runtime validation

### Frontend Components
- **Laundry Interface**: Main service interface with clothing selection and cart sidebar
- **Clothing Grid**: Displays clothing items with category filtering and search functionality
- **Service Selection Modal**: Modal for selecting laundry services after choosing clothing items
- **Laundry Cart Sidebar**: Manages cart items showing clothing + service combinations with quantity controls
- **Receipt Modal**: Displays transaction receipts with print/email options
- **Responsive Design**: Mobile-first approach with bottom navigation for mobile devices

### Backend API Routes
- **Clothing Items API**: GET /api/clothing-items (with category/search filtering), GET /api/clothing-items/:id
- **Laundry Services API**: GET /api/laundry-services (with category/search filtering), GET /api/laundry-services/:id
- **Transactions API**: POST /api/transactions for order processing
- **Service Management**: No stock tracking needed as laundry services are unlimited capacity

### Cart Management
- **Local State**: Custom React hook managing laundry cart items (clothing + service combinations)
- **Unique Item Identification**: Each cart item combines clothing item ID and service ID for uniqueness
- **Tax Calculation**: Configurable tax rate (8.5% default)
- **Payment Methods**: Support for cash and card payments
- **Real-time Updates**: Immediate UI updates with server synchronization

## Data Flow

1. **Clothing Selection**: Frontend fetches clothing items from `/api/clothing-items` with optional filtering
2. **Service Selection**: User clicks clothing item → modal opens → fetches services from `/api/laundry-services`
3. **Cart Operations**: User selects service + quantity → adds clothing+service combination to cart
4. **Order Processing**: Cart data sent to `/api/transactions` endpoint for completion
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

## Recent Changes (Jan 2025)

- **System Transformation**: Converted from traditional POS system to laundry management system
- **New Data Models**: Separated clothing items (no pricing) from laundry services (with pricing)
- **Enhanced User Flow**: Two-step selection process - first clothing item, then service type
- **Service Categories**: Basic, Premium, Specialty, and Express service categories
- **Cart Logic**: Combined clothing + service items with unique identifiers for proper cart management
- **Database Migration**: Successfully migrated from in-memory storage to PostgreSQL database using Neon
  - Implemented DatabaseStorage class replacing MemStorage
  - Pushed schema to production database using Drizzle Kit
  - Populated database with initial clothing items and laundry services data
  - All API endpoints now use persistent PostgreSQL storage

The application is designed as a full-stack monorepo with clear separation between client and server code, while maintaining shared type safety and efficient development workflows. The laundry-specific workflow allows customers to specify quantities of different clothing items and select appropriate services for each item type.