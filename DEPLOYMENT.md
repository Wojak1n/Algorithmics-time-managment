# Deployment Guide

## Vercel Deployment

### Prerequisites
1. GitHub account with your code pushed
2. Vercel account (free tier available)
3. PostgreSQL database (Neon, Supabase, or Railway)

### Environment Variables Required
```
DATABASE_URL=your-postgresql-connection-string
JWT_SECRET=your-strong-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-app.vercel.app
```

### Database Setup
1. Create a PostgreSQL database on Neon, Supabase, or Railway
2. Copy the connection string
3. Add it to Vercel environment variables
4. Run `npx prisma db push` to create tables
5. Run `npx prisma db seed` to add initial data

### Demo Accounts
After seeding, these accounts will be available:
- Admin: admin@test.com / password
- Teacher: teacher@test.com / password
- Student: student@test.com / password

### Build Commands
- Build Command: `npm run build`
- Install Command: `npm install`
- Output Directory: `.next`
