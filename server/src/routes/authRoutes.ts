import { Router } from 'express';
import { register, login } from '../controllers/authController';
import { verifyToken } from '../middleware/auth';
import { updateProfile, deleteAccount} from '../controllers/authController';
const router = Router();

router.post('/register', register);
router.post('/login', login); // <--- ADD THIS
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: "Logged out" });
});
// Add this new route at the bottom
router.get('/me', verifyToken, (req, res) => {
  res.json({ valid: true, userId: (req as any).userId });
});

router.put('/profile', verifyToken, updateProfile);   // Update
router.delete('/profile', verifyToken, deleteAccount); // Delete

// LOGOUT ROUTE
router.post('/logout', (req, res) => {
  res.clearCookie('token'); // This deletes the cookie
  res.json({ message: "Logged out" });
});

export default router;