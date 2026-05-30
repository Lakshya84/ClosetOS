const express = require('express');
const router = express.Router();
const multer = require('multer');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');
const { CreateItemSchema, UpdateItemSchema, TransferItemSchema } = require('../validators/schemas');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

// Setup multer memory-based file storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max size
});

// Helper: Calculate if item is overdue
const getIsOverdue = (status, returnDate) => {
  const outStatuses = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'];
  return outStatuses.includes(status) && returnDate && new Date(returnDate) < new Date();
};

// Helper: Stream buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(new Error('Cloudinary integration is not configured on the server.'));
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'auravault', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(fileBuffer);
  });
};

// @route   GET /api/items
// @desc    Get all accessories for logged-in creator (supports filters)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    // Base query for user items
    const query = { owner: req.user.id };
    
    // Add optional status/category filters
    if (status) query.status = status;
    if (category) query.category = category;

    // Fetch items (leveraging the { status, category } compound index if filtered)
    const items = await Item.find(query).sort({ createdAt: -1 });

    // Transform items to include computed isOverdue field
    const itemsWithOverdue = items.map(item => {
      const itemObj = item.toObject();
      itemObj.isOverdue = getIsOverdue(item.status, item.returnDate);
      return itemObj;
    });

    return res.status(200).json(itemsWithOverdue);
  } catch (error) {
    console.error('Fetch Items Error:', error);
    return res.status(500).json({ message: 'Failed to retrieve accessories' });
  }
});

// @route   POST /api/items
// @desc    Create a new accessory (defaults to IN_CLOSET)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const validatedData = CreateItemSchema.parse(req.body);

    const newItem = await Item.create({
      ...validatedData,
      owner: req.user.id,
      status: 'IN_CLOSET' // Strict start state
    });

    const responseItem = newItem.toObject();
    responseItem.isOverdue = false;

    return res.status(201).json(responseItem);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors.map(err => err.message) 
      });
    }
    console.error('Create Item Error:', error);
    return res.status(500).json({ message: 'Failed to log new accessory' });
  }
});

// @route   GET /api/items/:id
// @desc    Retrieve details and loan log of a single accessory
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });

    if (!item) {
      return res.status(404).json({ message: 'Accessory not found' });
    }

    const itemObj = item.toObject();
    itemObj.isOverdue = getIsOverdue(item.status, item.returnDate);

    return res.status(200).json(itemObj);
  } catch (error) {
    console.error('Fetch Single Item Error:', error);
    return res.status(500).json({ message: 'Failed to retrieve accessory details' });
  }
});

// @route   PATCH /api/items/:id
// @desc    Edit standard metadata of an accessory (excluding status)
// @access  Private
router.patch('/:id', protect, async (req, res) => {
  try {
    const validatedData = UpdateItemSchema.parse(req.body);
    
    // Avoid status tampering through generic patch
    delete validatedData.status;

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { $set: validatedData },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Accessory not found' });
    }

    const itemObj = item.toObject();
    itemObj.isOverdue = getIsOverdue(item.status, item.returnDate);

    return res.status(200).json(itemObj);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors.map(err => err.message) 
      });
    }
    console.error('Update Item Error:', error);
    return res.status(500).json({ message: 'Failed to update accessory metadata' });
  }
});

// @route   PATCH /api/items/:id/transfer
// @desc    Trigger a state transition (enforcing state-machine and logging transfers)
// @access  Private
router.patch('/:id/transfer', protect, async (req, res) => {
  try {
    // 1. Zod input validation
    const validatedData = TransferItemSchema.parse(req.body);
    const { toStatus, recipientName, recipientContact, returnDate } = validatedData;

    // 2. Fetch current item state
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) {
      return res.status(404).json({ message: 'Accessory not found' });
    }

    const fromStatus = item.status;

    // 3. Enforce strictly server-side state machine
    if (!Item.canTransition(fromStatus, toStatus)) {
      return res.status(400).json({ 
        message: `Strict State Error: Transitioning from ${fromStatus} to ${toStatus} is strictly forbidden.` 
      });
    }

    // 4. Update custody and write logs
    const isOutStatus = ['ON_LOAN', 'SENT_TO_STYLIST', 'AT_PR'].includes(toStatus);
    const isReturning = toStatus === 'IN_CLOSET';
    const isMissing = toStatus === 'MISSING';

    // If we are returning or going missing, close out any existing active loan logs
    if (isReturning || isMissing) {
      item.loanLog.forEach(log => {
        if (!log.actualReturn) {
          log.actualReturn = new Date();
        }
      });
    }

    // Prepare fields to update on the main Item document
    if (isOutStatus) {
      item.status = toStatus;
      item.custodianName = recipientName;
      item.custodianContact = recipientContact || '';
      item.returnDate = new Date(returnDate);

      // Create new loan log entry
      item.loanLog.push({
        toStatus,
        recipientName,
        recipientContact: recipientContact || '',
        transferredAt: new Date(),
        expectedReturn: new Date(returnDate)
      });
    } else {
      // Transitioning to IN_CLOSET or MISSING
      item.status = toStatus;
      item.custodianName = '';
      item.custodianContact = '';
      item.returnDate = undefined;

      // Add simple return/missing state change entry to history
      item.loanLog.push({
        toStatus,
        transferredAt: new Date()
      });
    }

    await item.save();

    const itemObj = item.toObject();
    itemObj.isOverdue = getIsOverdue(item.status, item.returnDate);

    return res.status(200).json(itemObj);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: error.errors.map(err => err.path.join('.') + ': ' + err.message) 
      });
    }
    console.error('Transfer Accessory Error:', error);
    return res.status(500).json({ message: 'State transition failed' });
  }
});

// @route   DELETE /api/items/:id
// @desc    Remove accessory entirely
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user.id });

    if (!item) {
      return res.status(404).json({ message: 'Accessory not found' });
    }

    return res.status(200).json({ message: 'Accessory removed from archive', id: req.params.id });
  } catch (error) {
    console.error('Delete Accessory Error:', error);
    return res.status(500).json({ message: 'Failed to delete accessory' });
  }
});

// @route   POST /api/items/:id/image
// @desc    Cloudinary image upload for a specific accessory
// @access  Private
router.post('/:id/image', protect, upload.single('image'), async (req, res) => {
  try {
    const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
    if (!item) {
      return res.status(404).json({ message: 'Accessory not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    // Perform Cloudinary Upload
    try {
      const coverImageUrl = await uploadToCloudinary(req.file.buffer);
      
      // Update item cover
      item.coverImageUrl = coverImageUrl;
      await item.save();

      const itemObj = item.toObject();
      itemObj.isOverdue = getIsOverdue(item.status, item.returnDate);

      return res.status(200).json(itemObj);
    } catch (uploadError) {
      console.error('Cloudinary upload failure:', uploadError);
      return res.status(502).json({ 
        message: 'Cloudinary upload failed. The item is saved, but you can retry the image upload.', 
        code: 'IMAGE_UPLOAD_FAILED' 
      });
    }
  } catch (error) {
    console.error('Image Upload Route Error:', error);
    return res.status(500).json({ message: 'Server error during photo attachment' });
  }
});

module.exports = router;
