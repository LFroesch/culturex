import express, { Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadImage } from '../services/cloudinaryService';

const router = express.Router();

// Upload single image
router.post('/image', authMiddleware, upload.single('image'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const imageUrl = await uploadImage(req.file.buffer, 'cultural-exchange/posts');
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// Upload multiple images
router.post('/images', authMiddleware, upload.array('images', 5), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const uploadPromises = req.files.map(file => uploadImage(file.buffer, 'cultural-exchange/posts'));
    const imageUrls = await Promise.all(uploadPromises);

    res.json({ urls: imageUrls });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Upload profile photo
router.post('/profile-photo', authMiddleware, upload.single('photo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const imageUrl = await uploadImage(req.file.buffer, 'cultural-exchange/profiles');
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile photo' });
  }
});

export default router;
