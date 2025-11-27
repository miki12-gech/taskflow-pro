import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  // Validation with Custom Message
  password: z.string().min(8, "Password must be at least 8 characters long.")
});

// We can accept weaker logic for login (just check string), 
// but creating the object is good practice.
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});