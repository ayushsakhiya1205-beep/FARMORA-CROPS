const express = require('express');
const Reminder = require('../models/Reminder');
const Product = require('../models/Product');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reminders
// @desc    Get active reminders for customer
// @access  Private (Customer)
router.get('/', auth, authorize('customer'), async (req, res) => {
  try {
    const reminders = await Reminder.find({
      customerId: req.user._id,
      isActive: true
    })
      .populate('productId', 'name image price unit')
      .sort({ reminderDate: 1 });

    // Filter reminders that are due or approaching (within 7 days)
    const now = new Date();
    const dueReminders = reminders.filter(reminder => {
      const daysUntilReminder = Math.ceil(
        (reminder.reminderDate - now) / (1000 * 60 * 60 * 24)
      );
      return daysUntilReminder <= 7 && daysUntilReminder >= -7;
    });

    res.json(dueReminders);
  } catch (error) {
    console.error('Get reminders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/reminders/:id/dismiss
// @desc    Dismiss a reminder
// @access  Private (Customer)
router.put('/:id/dismiss', auth, authorize('customer'), async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({ message: 'Reminder not found' });
    }

    if (reminder.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    reminder.isActive = false;
    reminder.isNotified = true;
    await reminder.save();

    res.json({ message: 'Reminder dismissed', reminder });
  } catch (error) {
    console.error('Dismiss reminder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

