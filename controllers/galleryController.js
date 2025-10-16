const GalleryImage = require('../models/GalleryImage');
const cloudinary = require('../utils/cloudinary');

const normalizeTags = (tags = []) =>
  tags
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

exports.listImages = async (req, res) => {
  try {
    const { page = 1, limit = 12, featured } = req.query;
    const query = {};

    if (featured === 'true') {
      query.isFeatured = true;
    }

    const images = await GalleryImage.find(query)
      .sort({ order: -1, createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    const total = await GalleryImage.countDocuments(query);

    res.json({
      data: images,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore: Number(page) * Number(limit) < total
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Image file is required' });
    }

    const uploadResult = await cloudinary.uploader.upload_stream_async(req.file.buffer, {
      folder: process.env.CLOUDINARY_FOLDER || 'gallery',
      transformation: [{ width: 800, height: 600, crop: 'limit' }]
    });

    const { title, description, tags, isFeatured, order } = req.body;
    const normalizedTags = typeof tags === 'string' ? tags.split(',') : tags;

    const image = await GalleryImage.create({
      title,
      description,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      tags: normalizeTags(normalizedTags || []),
      isFeatured: isFeatured === 'true' || isFeatured === true,
      order: order ? Number(order) : 0,
      width: uploadResult.width,
      height: uploadResult.height
    });

    console.log(`[Gallery] Image created: ${title} at ${new Date().toISOString()}`);

    res.status(201).json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, tags, isFeatured, order } = req.body;

    const image = await GalleryImage.findById(id);
    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (req.file) {
      await cloudinary.uploader.destroy(image.publicId);
      const uploadResult = await cloudinary.uploader.upload_stream_async(req.file.buffer, {
        folder: process.env.CLOUDINARY_FOLDER || 'gallery',
        transformation: [{ width: 800, height: 600, crop: 'limit' }]
      });
      image.imageUrl = uploadResult.secure_url;
      image.publicId = uploadResult.public_id;
      image.width = uploadResult.width;
      image.height = uploadResult.height;
    }

    if (title !== undefined) image.title = title;
    if (description !== undefined) image.description = description;
    if (tags !== undefined) {
      const normalizedTags = typeof tags === 'string' ? tags.split(',') : tags;
      image.tags = normalizeTags(normalizedTags || []);
    }

    if (isFeatured !== undefined) {
      image.isFeatured = isFeatured === 'true' || isFeatured === true;
    }

    if (order !== undefined) {
      image.order = Number(order);
    }

    await image.save();

    res.json(image);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteImage = async (req, res) => {
  try {
    const { id } = req.params;
    const image = await GalleryImage.findById(id);

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    await cloudinary.uploader.destroy(image.publicId);
    await image.deleteOne();

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};