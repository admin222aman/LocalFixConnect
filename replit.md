# Overview

LocalFix is a full-stack web application that connects customers with local service professionals such as electricians, plumbers, carpenters, and other skilled tradespeople. The platform allows customers to browse service categories, find verified providers in their area, book services, and leave reviews. Service providers can create profiles, manage their availability, and receive bookings from customers. The application includes an admin panel for managing provider approvals and overseeing the platform.

# User Preferences

Preferred communication style: Simple, everyday language.
Admin panel access: Hidden admin panel URL for security (/admin/dashboard/management)

# System Architecture

## Frontend Architecture
The frontend is built with React 18 using Vite as the build tool and development server. The application uses a component-based architecture with TypeScript for type safety. State management is handled through React Query for server state and local React state for UI components.

**Key Frontend Decisions:**
- **React Router Alternative**: Uses Wouter for lightweight client-side routing instead of React Router
- **UI Framework**: Implements shadcn/ui components built on Radix UI primitives for accessibility and customization
- **Styling**: Tailwind CSS with CSS custom properties for theming and responsive design
- **Form Management**: React Hook Form with Zod for validation provides type-safe form handling
- **Component Structure**: Follows atomic design principles with reusable UI components in `/components/ui/`

## Backend Architecture
The backend follows a traditional Express.js REST API architecture with TypeScript. The server handles authentication, API routes, and serves the frontend in production.

**Key Backend Decisions:**
- **Session Management**: Uses express-session with MemoryStore for development simplicity
- **Authentication**: Implements role-based authentication (customer, provider, admin) with bcrypt password hashing
- **API Design**: RESTful endpoints following conventional HTTP methods and status codes
- **Error Handling**: Centralized error handling middleware with consistent error response format
- **Development Setup**: Vite middleware integration for hot reloading during development

## Data Storage Solutions
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database interactions.

**Key Data Decisions:**
- **ORM Choice**: Drizzle ORM provides type safety and performance while maintaining SQL transparency
- **Schema Design**: Relational model with users, providers, service categories, bookings, and reviews
- **Database Provider**: Configured for Neon Database (serverless PostgreSQL) for scalability
- **Migration Strategy**: Drizzle Kit handles schema migrations and database pushes

## Authentication and Authorization
Multi-role authentication system supporting customers, service providers, and administrators.

**Key Auth Decisions:**
- **Session-based Auth**: Server-side sessions stored in memory (development) with HTTP-only cookies
- **Role-based Access**: Middleware functions enforce role requirements for different endpoints
- **Password Security**: bcrypt with salt rounds for secure password storage
- **Admin Access**: Special admin portal route with additional password protection

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database for production deployments
- **Drizzle ORM**: Type-safe ORM and query builder for PostgreSQL interactions
- **connect-pg-simple**: PostgreSQL session store for production session persistence

## UI and Component Libraries
- **Radix UI**: Headless UI primitives for accessibility and customization (@radix-ui/react-*)
- **Lucide React**: Icon library for consistent iconography throughout the application
- **Tailwind CSS**: Utility-first CSS framework for styling and responsive design
- **shadcn/ui**: Pre-built component system built on Radix UI and Tailwind CSS

## Development and Build Tools
- **Vite**: Fast build tool and development server with TypeScript support
- **React Query**: Server state management and caching library (@tanstack/react-query)
- **Wouter**: Minimalist routing library as React Router alternative
- **PostCSS**: CSS processing with Tailwind CSS and Autoprefixer plugins

## Utility Libraries
- **React Hook Form**: Performant form library with built-in validation
- **Zod**: Schema validation library for type-safe data validation
- **bcryptjs**: Password hashing and verification library
- **date-fns**: Date manipulation and formatting utility library