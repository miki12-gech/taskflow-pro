import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extending the Request type so TypeScript knows 'userId' exists on it
interface AuthRequest extends Request {
  userId?: string;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Get the cookie
  const token = req.cookies.token;

  if (!token) {
     res.status(401).json({ error: "Not Authenticated!" });
     return; // Block request here
  }

  try {
    // 2. Verify logic
    const payload = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret") as { userId: string };
    
    // 3. Attach user ID to request so the controller can use it
    req.userId = payload.userId;
    
    // 4. Move to next stop (The Controller)
    next();
  } catch (err) {
     res.status(401).json({ error: "Invalid Token" });
     return; 
  }
};