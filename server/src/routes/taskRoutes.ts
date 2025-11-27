import { Router } from 'express';
import { verifyToken } from '../middleware/auth'; // <--- Import the Guard
import { updateTaskDate,
  getTasks, 
  createTask, 
  toggleTaskStatus, 
  deleteTask ,
  updateTaskTitle
} from '../controllers/taskControllers';

const router = Router();

// APPLY MIDDLEWARE TO ALL ROUTES HERE

// "Use the security guard for every request below this line"
router.use(verifyToken); 
router.patch('/:id/date', updateTaskDate);
router.get('/', getTasks);
router.post('/', createTask);
router.patch('/:id/status', toggleTaskStatus);
router.delete('/:id', deleteTask);
router.patch('/:id/title', updateTaskTitle);
export default router;