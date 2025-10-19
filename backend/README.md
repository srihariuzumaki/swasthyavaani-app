# Swasthya Vaani Backend API

A comprehensive backend API for the Swasthya Vaani health companion app, built with Express.js and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with registration, login, and profile management
- **Medicine Database**: Comprehensive medicine information with search capabilities
- **Symptom Checker**: Symptom database with suggested treatments and home remedies
- **Medication Reminders**: Full CRUD operations for medication reminders with dose tracking
- **User Profiles**: Medical history, allergies, and preferences management
- **Security**: Rate limiting, CORS, helmet security headers, and input validation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Development**: Nodemon for hot reloading

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/preferences` - Update user preferences
- `POST /api/users/medical-history` - Add medical history entry
- `POST /api/users/allergies` - Add allergy entry
- `DELETE /api/users/medical-history/:index` - Remove medical history entry
- `DELETE /api/users/allergies/:index` - Remove allergy entry

### Reminders
- `GET /api/reminders` - Get all reminders
- `GET /api/reminders/:id` - Get specific reminder
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder
- `POST /api/reminders/:id/complete` - Mark dose as completed
- `POST /api/reminders/:id/miss` - Mark dose as missed
- `PUT /api/reminders/:id/toggle` - Toggle reminder active status

### Medicines
- `GET /api/medicines` - Search medicines
- `GET /api/medicines/:id` - Get medicine details
- `GET /api/medicines/categories/list` - Get medicine categories
- `GET /api/medicines/popular` - Get popular medicines

### Symptoms
- `GET /api/symptoms` - Search symptoms
- `GET /api/symptoms/:id` - Get symptom details
- `GET /api/symptoms/categories/list` - Get symptom categories
- `GET /api/symptoms/common` - Get common symptoms
- `POST /api/symptoms/check` - Check symptoms and get suggestions

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/swasthyavaani
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   FRONTEND_URL=http://localhost:5173
   ```

3. **Start MongoDB**:
   Make sure MongoDB is running on your system.

4. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

5. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

### Production Deployment

1. **Build and start**:
   ```bash
   npm start
   ```

2. **Environment Variables**:
   Make sure to set the following environment variables in production:
   - `NODE_ENV=production`
   - `MONGODB_URI` (your production MongoDB connection string)
   - `JWT_SECRET` (a strong, random secret)
   - `FRONTEND_URL` (your frontend URL)

## Database Schema

### User Model
- Personal information (name, email, phone, dateOfBirth, gender)
- Medical history and allergies
- User preferences (theme, notifications, language)
- Authentication fields

### Reminder Model
- Medicine information and dosage
- Timing and frequency
- Completion tracking
- User association

### Medicine Model
- Medicine details (name, generic name, category)
- Dosage information
- Side effects and contraindications
- Search keywords

### Symptom Model
- Symptom information and categorization
- Suggested medicines and home remedies
- Related symptoms
- Search capabilities

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers
- **Password Hashing**: bcrypt for secure password storage

## Development

### Scripts
- `npm run dev` - Start development server with hot reloading
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

### Code Structure
```
src/
├── config/          # Database configuration
├── controllers/     # Route controllers (if needed)
├── middleware/      # Custom middleware
├── models/          # MongoDB models
├── routes/          # API routes
├── utils/           # Utility functions
└── server.js        # Main server file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
