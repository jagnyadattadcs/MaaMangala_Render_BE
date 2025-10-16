const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/galleryController');
const authMiddleware = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', galleryController.listImages);
router.post('/', authMiddleware, upload.single('image'), galleryController.createImage);
router.put('/:id', authMiddleware, upload.single('image'), galleryController.updateImage);
router.delete('/:id', authMiddleware, galleryController.deleteImage);

module.exports = router;