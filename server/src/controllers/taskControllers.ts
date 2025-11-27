import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Define custom request type to handle userId from middleware
interface AuthRequest extends Request {
  userId?: string;
}

// 1. GET MY TASKS
export const getTasks = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest; // Type assertion
  
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId: authReq.userId // <--- ONLY fetch tasks for this user
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
};

// 2. CREATE TASK
// Look for your existing createTask and update the 'const' line and prisma.create line:
// CREATE TASK
export const createTask = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  
  try {
    // 1. Are you extracting dueDate from the request?
    const { title, priority, dueDate } = req.body; 

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        priority: priority || "LOW",
        
        // 2. >>> THIS IS THE CRITICAL LINE <<<
        // If this line is missing, the DB gets "null".
        dueDate: dueDate ? new Date(dueDate) : null, 
        
        userId: authReq.userId! 
      }
    });

    res.json(newTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
};

// 3. TOGGLE STATUS (With Security Check)
export const toggleTaskStatus = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;

  try {
    const { id } = req.params; 
    const { isDone } = req.body;

    // Ensure this task actually belongs to the logged-in user!
    const task = await prisma.task.findFirst({ where: { id, userId: authReq.userId }});
    
    if (!task) {
        res.status(403).json({ error: "Unauthorized or Task not found" });
        return; 
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { isDone }
    });
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
};

// 4. DELETE TASK (With Security Check)
export const deleteTask = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  
  try {
    const { id } = req.params;

    // Security Check: Do you own this?
    const task = await prisma.task.findFirst({ where: { id, userId: authReq.userId }});
    
    if (!task) {
        res.status(403).json({ error: "Unauthorized" });
        return; 
    }
    
    await prisma.task.delete({ where: { id } });

    res.json({ message: "Task deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
};

// 5. UPDATE TITLE
export const updateTaskTitle = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  
  try {
    const { id } = req.params; 
    const { title } = req.body;

    if (!title) return;

    // Security: Ensure user owns task
    const task = await prisma.task.findFirst({ where: { id, userId: authReq.userId }});
    if (!task) {
        res.status(403).json({ error: "Unauthorized" });
        return; 
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: { title }
    });
    
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to update task" });
  }
};

export const updateTaskDate = async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  try {
    const { id } = req.params; 
    const { dueDate } = req.body; // Expects string "2025-01-30" or null

    const updatedTask = await prisma.task.update({
      where: { id, userId: authReq.userId }, // Security check inline
      data: { 
        dueDate: dueDate ? new Date(dueDate) : null 
      }
    });
    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ error: "Failed to update date" });
  }
};