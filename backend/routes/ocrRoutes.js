import express from 'express';
import multer from 'multer';
import { scanReceipt } from '../controllers/ocrController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticateToken);
router.post('/scan', upload.single('receipt'), scanReceipt);

export default router;
