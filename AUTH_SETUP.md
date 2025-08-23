# NextAuth.js with MongoDB Setup Guide

This project now includes NextAuth.js authentication with MongoDB integration. Here's how to set it up:

## Prerequisites

1. **MongoDB Database**: You need a MongoDB database running locally or a MongoDB Atlas cluster
2. **Node.js**: Make sure you have Node.js installed

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:5173
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/skindisease
MONGODB_DB=skindisease
```

**Important Notes:**
- Replace `your-nextauth-secret-key-here` with a secure random string (you can generate one using `openssl rand -base64 32`)
- For production, use a proper MongoDB Atlas URI
- Make sure the MongoDB URI points to your actual database

### 2. MongoDB Setup

#### Local MongoDB:
1. Install MongoDB locally
2. Start the MongoDB service
3. Create a database named `skindisease`

#### MongoDB Atlas (Recommended for production):
1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Replace the `MONGODB_URI` with your Atlas connection string

### 3. Database Collections

The following collections will be automatically created by NextAuth:
- `users` - User accounts
- `accounts` - OAuth accounts (if using OAuth providers)
- `sessions` - User sessions
- `verification_tokens` - Email verification tokens

### 4. Running the Application

```bash
npm run dev
```

The application will start on `http://localhost:5173`

## Features Implemented

### Authentication
- ✅ User registration with email/password
- ✅ User login with email/password
- ✅ Password hashing with bcrypt
- ✅ Session management
- ✅ Protected routes with middleware
- ✅ Logout functionality

### User Management
- ✅ User profile display
- ✅ Session-based user information
- ✅ Automatic redirects for authenticated users

### Security
- ✅ Password hashing
- ✅ JWT session strategy
- ✅ Route protection
- ✅ CSRF protection (built into NextAuth)

## API Endpoints

- `POST /api/auth/signup` - User registration
- `GET/POST /api/auth/[...nextauth]` - NextAuth endpoints (login, logout, etc.)

## Usage

### Registration
1. Navigate to `/signup`
2. Fill in your details
3. Submit the form
4. You'll be redirected to login

### Login
1. Navigate to `/login`
2. Enter your credentials
3. You'll be redirected to the dashboard

### Protected Routes
The following routes are protected and require authentication:
- `/dashboard`
- `/full-dashboard`
- `/analyze-skin`
- `/book-appointment`
- `/chatbot`

### Logout
- Use the logout button in the dashboard header
- Or navigate to `/api/auth/signout`

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your `MONGODB_URI` in `.env.local`
   - Ensure MongoDB is running
   - Verify network connectivity

2. **NextAuth Secret Error**
   - Generate a new secret using: `openssl rand -base64 32`
   - Update `NEXTAUTH_SECRET` in `.env.local`

3. **Session Not Persisting**
   - Check `NEXTAUTH_URL` matches your development URL
   - Ensure cookies are enabled in your browser

### Development Tips

- Use MongoDB Compass to view your database collections
- Check the browser console for authentication errors
- Monitor the terminal for API route errors

## Production Deployment

For production deployment:

1. Set up a production MongoDB database (MongoDB Atlas recommended)
2. Update environment variables with production values
3. Set `NEXTAUTH_URL` to your production domain
4. Use a strong `NEXTAUTH_SECRET`
5. Enable HTTPS in production

## Additional Features to Consider

- Email verification
- Password reset functionality
- OAuth providers (Google, GitHub, etc.)
- User roles and permissions
- Profile image upload
- Two-factor authentication

