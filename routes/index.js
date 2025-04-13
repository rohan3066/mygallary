const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Image = require('../models/Image');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Buffer to stream for Cloudinary
const bufferToStream = (buffer) => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

// Routes
router.get('/login', (req, res) => res.render('login', { error: null }));

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });
    const user = await User.authenticate(username, password);
    if (!user) {
      console.log('Authentication failed for:', username);
      return res.render('login', { error: 'Invalid credentials.' });
    }
    console.log('Authentication successful for:', username);
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    req.session.token = token;
    console.log('Session token set:', token);
    res.redirect('/gallery');
  });

router.get('/gallery', auth, async (req, res) => {
  const images = await Image.find().populate('uploadedBy');
  res.render('gallery', { images });
});

router.get('/upload', auth, (req, res) => res.render('upload', { error: null }));

router.post('/upload', auth, upload.single('image'), async (req, res) => {
    try {
      console.log('Upload attempt:', {
        fileExists: !!req.file,
        fileDetails: req.file ? { originalname: req.file.originalname, size: req.file.size } : null,
      });
  
      if (!req.file) {
        throw new Error('No file uploaded');
      }
  
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'romantic-gallery' },
          (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              resolve(result);
            }
          }
        );
        bufferToStream(req.file.buffer).pipe(stream);
      });
  
      console.log('Cloudinary upload result:', {
        secure_url: result.secure_url,
        public_id: result.public_id,
      });
  
      const image = new Image({
        url: result.secure_url,
        publicId: result.public_id,
        uploadedBy: req.user.id,
      });
      await image.save();
      console.log('Image saved to database:', image._id);
      res.redirect('/gallery');
    } catch (err) {
      console.error('Upload error:', err.message);
      res.render('upload', { error: 'Upload failed: ' + err.message });
    }
  });
router.get('/edit/:id', auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    res.render('edit', { image, error: null });
  } catch (err) {
    res.redirect('/gallery');
  }
});

router.post('/edit/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    let update = {};

    if (req.file) {
      await cloudinary.uploader.destroy(image.publicId);
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'romantic-gallery' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        bufferToStream(req.file.buffer).pipe(stream);
      });
      update = {
        url: result.secure_url,
        publicId: result.public_id,
      };
    }

    await Image.findByIdAndUpdate(req.params.id, update);
    res.redirect('/gallery');
  } catch (err) {
    res.render('edit', { image, error: 'Update failed.' });
  }
});

router.post('/delete/:id', auth, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    await cloudinary.uploader.destroy(image.publicId);
    await Image.findByIdAndDelete(req.params.id);
    res.redirect('/gallery');
  } catch (err) {
    res.redirect('/gallery');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;