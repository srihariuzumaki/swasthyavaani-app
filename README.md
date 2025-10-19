# Swasthya Vaani

Your personal, easy-to-use health companion. Swasthya Vaani helps you check symptoms, get basic medicine suggestions, manage medication reminders, and chat with an AI assistant for health guidance.

## 🚀 Features

- **AI Health Assistant**: Chat with an AI about medicines, symptoms, and general health advice. Responses can be spoken aloud for accessibility.
- **Symptom Checker**: Select common symptoms to see suggested over‑the‑counter medicines and typical dosage guidance. Includes a clear safety note to consult a doctor.
- **Medication Reminders**: Create and manage daily medicine reminders, mark doses complete, and review completed reminders.
- **Medicine Search**: Use the home search bar to quickly look up medicines with comprehensive database.
- **User Profiles**: Manage medical history, allergies, and personal preferences.
- **Daily Health Tips**: Simple, actionable wellness tips surfaced on the home screen.
- **Modern UI with Dark Mode**: Clean, mobile‑first interface with a theme toggle.

## 🏗️ Architecture

This project consists of two main parts:

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with Tailwind CSS
- **State Management**: React Query for server state
- **Routing**: React Router DOM
- **Build Tool**: Vite

### Backend (Node.js + Express + MongoDB)
- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based authentication
- **API**: RESTful API with comprehensive endpoints
- **Security**: Rate limiting, CORS, input validation

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Frontend Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. **Navigate to backend directory**:
   ```bash
   cd backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
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

4. **Start MongoDB**:
   Make sure MongoDB is running on your system.

5. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

6. **Start the development server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:5000`

### Full Stack Development

To run both frontend and backend simultaneously:

1. **Terminal 1 - Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Terminal 2 - Frontend**:
   ```bash
   npm run dev
   ```

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/medical-history` - Add medical history
- `POST /api/users/allergies` - Add allergy information

### Reminders
- `GET /api/reminders` - Get all reminders
- `POST /api/reminders` - Create new reminder
- `PUT /api/reminders/:id` - Update reminder
- `DELETE /api/reminders/:id` - Delete reminder

### Medicines
- `GET /api/medicines` - Search medicines
- `GET /api/medicines/:id` - Get medicine details

### Symptoms
- `GET /api/symptoms` - Search symptoms
- `POST /api/symptoms/check` - Check symptoms and get suggestions

## 🔧 Development Scripts

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start development server with hot reloading
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data

## 🚀 Coming Soon

- **Voice input for queries**
- **Camera scan for medicine packs**
- **Push notifications for reminders**
- **Health data analytics**
- **Doctor consultation booking**

## ⚠️ Important Note

Swasthya Vaani is for information only and does not replace medical advice from a qualified healthcare professional. Always consult with a healthcare provider for proper medical diagnosis and treatment.

## 📄 License

MIT License - see LICENSE file for details
