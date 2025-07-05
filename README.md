# Automated Time Management System

A comprehensive web-based timetable scheduling system built with Next.js, Prisma, and PostgreSQL.

## Issues Fixed

### 1. Critical Configuration Issues
- **Fixed Next.js Config**: Removed `output: 'export'` which was preventing API routes from working
- **Added Environment Variables**: Created `.env` file with required database and JWT configurations
- **Fixed Routing**: Updated sidebar dashboard link from `/dashboard` to `/` to match the actual route

### 2. Database Setup
- **PostgreSQL Configuration**: Set up proper DATABASE_URL in environment variables
- **Prisma Schema**: Complete database schema with proper relationships
- **Seed Data**: Comprehensive seed file with demo users and data

### 3. Authentication System
- **JWT Implementation**: Secure token-based authentication
- **Password Hashing**: Using bcryptjs for secure password storage
- **Role-based Access**: Admin, Teacher, and Student roles with proper permissions

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Installation

1. **Clone and Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   ```bash
   # Create PostgreSQL database named 'timetable_db'
   # Update DATABASE_URL in .env if needed
   
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed database with demo data
   npm run db:seed
   ```

3. **Environment Configuration**
   - The `.env` file is already configured with development defaults
   - For production, update the JWT_SECRET and DATABASE_URL

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Access the Application**
   - Open http://localhost:3000
   - Use demo accounts:
     - Admin: admin@test.com / password
     - Teacher: teacher@test.com / password  
     - Student: student@test.com / password

## Features

- **User Management**: Admin can manage users, teachers, and students
- **Course Management**: Create and manage courses with subjects and schedules
- **Room Management**: Manage classroom resources and availability
- **Group Management**: Organize students into groups
- **Timetable Generation**: Automated scheduling algorithms
- **Role-based Dashboard**: Different views for Admin, Teacher, and Student roles
- **Responsive Design**: Works on desktop and mobile devices

## Technology Stack

- **Frontend**: Next.js 13, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: JWT with bcryptjs
- **UI Components**: Radix UI, Lucide Icons

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   └── ui/               # UI components
├── lib/                  # Utility libraries
├── prisma/               # Database schema and migrations
└── hooks/                # Custom React hooks
```

## Demo Accounts

The system comes with pre-configured demo accounts:

- **Admin User**: Full system access, can manage all entities
- **Teacher User**: Can view and manage their courses and schedules  
- **Student User**: Can view their personal timetable and subjects

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with demo data
