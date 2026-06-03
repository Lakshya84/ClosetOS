const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Retrieve all system notifications for the authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);
    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Fetch Notifications Error:', error);
    return res.status(500).json({ message: 'Failed to fetch system notifications' });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.status(200).json(notification);
  } catch (error) {
    console.error('Read Notification Error:', error);
    return res.status(500).json({ message: 'Failed to update notification state' });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all unread notifications as read
// @access  Private
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { owner: req.user.id, read: false },
      { $set: { read: true } }
    );
    return res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Read All Notifications Error:', error);
    return res.status(500).json({ message: 'Failed to clear unread states' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a single notification alert
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    return res.status(200).json({ message: 'Notification cleared', id: req.params.id });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    return res.status(500).json({ message: 'Failed to delete notification' });
  }
});

// @route   DELETE /api/notifications
// @desc    Delete/Clear all notification history for user
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ owner: req.user.id });
    return res.status(200).json({ message: 'All notification history cleared successfully' });
  } catch (error) {
    console.error('Clear All Notifications Error:', error);
    return res.status(500).json({ message: 'Failed to flush notification archive' });
  }
});

module.exports = router;
