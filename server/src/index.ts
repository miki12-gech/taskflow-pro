import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser'; // <--- 1. IMPORT THIS
import taskRoutes from './routes/taskRoutes';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
const ALLOWED_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: ALLOWED_ORIGIN, // Uses live URL in prod, localhost in dev
  credentials: true, 
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
}));
app.use(express.json());
app.use(cookieParser()); // <--- 2. ADD THIS LINE (Essential!)

// Routes
app.use('/api/tasks', taskRoutes);
app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});