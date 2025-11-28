import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { registerSchema } from '../schemas/auth.schema';

const prisma = new PrismaClient();

// REGISTER FUNCTION
export const register = async (req: Request, res: Response) => {
  try {
    // 1. Valida   te Input using Zod
    // 1. Validate Input
    const validation = registerSchema.safeParse(req.body);
    
    if (!validation.success) {
      // format the errors into a single string or grab the first one
      // TypeScript knows 'error' exists here because we checked !success
      const firstError = validation.error.issues[0].message;
      res.status(400).json({ error: firstError });
      return; 
    }
    
    // Success!
    const { email, password } = validation.data;

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "Email already exists" });
      return; 
    }

    // 3. Hash
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create
    const user = await prisma.user.create({
      data: { email, password: hashedPassword }
    });

    // 5. Sign Token
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: '7d' });

    // 6. COOKIE (Important: path set to /)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // "none" allows Cross-Site (Vercel -> Render)
      path: "/", 
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({ id: user.id, email: user.email });

  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// LOGIN FUNCTION
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Manual checks for login (Schema not strictly needed here)
    if (!email || !password) {
      res.status(400).json({ error: "Please enter both email and password" });
      return; 
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Unified error message for security
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).json({ error: "Invalid email or password" });
      return; 
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "secret", { expiresIn: '7d' });

    // FIX: ENSURE path: '/' IS HERE TOO!
  res.cookie("token", token, {
      httpOnly: true,
      secure: true,        // Force Secure (HTTPS)
      sameSite: "none",    // Force None (Cross-Site)
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ id: user.id, email: user.email, name: user.name });

  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// UPDATE PROFILE
export const updateProfile = async (req: Request, res: Response) => {
  // Use "req as any" to bypass TS strict checks quickly if middleware is standard
  const userId = (req as any).userId; 
  const { name, currentPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return; 
    }

    // Prepare update data
    let updateData: any = { name };

    // If changing password
    if (newPassword && currentPassword) {
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        res.status(400).json({ error: "Incorrect current password" });
        return; 
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    // Save to DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true } // Don't return password!
    });

    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// DELETE ACCOUNT
export const deleteAccount = async (req: Request, res: Response) => {
  const userId = (req as any).userId; 
  try {
    // 1. Delete all user's tasks first (Cascading delete)
    await prisma.task.deleteMany({ where: { userId } });
    
    // 2. Delete user
    await prisma.user.delete({ where: { id: userId } });
    
    // 3. Clear cookie
    res.clearCookie('token');
    res.json({ message: "Account deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account" });
  }
};