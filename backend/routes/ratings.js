const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const Product = require('../models/Product');
const { auth } = require('../middleware/auth');

// @route   POST /api/ratings
// @desc    Add or update a rating for a product
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    console.log('🔍 DEBUG: Rating request received:', req.body);
    console.log('🔍 DEBUG: User authenticated:', req.user ? req.user._id : 'No user');
    
    const { productId, rating, review } = req.body;

    // Validate rating
    if (!productId || !rating || rating < 1 || rating > 5) {
      console.log('❌ DEBUG: Validation failed:', { productId, rating });
      return res.status(400).json({ message: 'Valid product ID and rating (1-5) required' });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      console.log('❌ DEBUG: Product not found:', productId);
      return res.status(404).json({ message: 'Product not found' });
    }

    console.log('✅ DEBUG: Product found:', product.name);

    // Check if user has already rated this product
    const existingRating = await Rating.findOne({ userId: req.user._id, productId });

    if (existingRating) {
      console.log('🔄 DEBUG: Updating existing rating');
      // Update existing rating
      const oldRating = existingRating.rating;
      existingRating.rating = rating;
      existingRating.review = review || '';
      await existingRating.save();

      // Update product average rating
      const allRatings = await Rating.find({ productId });
      const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allRatings.length;

      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalRatings: allRatings.length
      });

      console.log('✅ DEBUG: Rating updated successfully');
      return res.json({
        message: 'Rating updated successfully',
        rating: existingRating,
        averageRating: Math.round(averageRating * 10) / 10
      });
    } else {
      console.log('➕ DEBUG: Creating new rating');
      // Create new rating
      const newRating = new Rating({
        userId: req.user._id,
        productId,
        rating,
        review: review || ''
      });

      await newRating.save();

      // Update product average rating
      const allRatings = await Rating.find({ productId });
      const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRating / allRatings.length;

      await Product.findByIdAndUpdate(productId, {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalRatings: allRatings.length
      });

      console.log('✅ DEBUG: New rating created successfully');
      return res.status(201).json({
        message: 'Rating added successfully',
        rating: newRating,
        averageRating: Math.round(averageRating * 10) / 10
      });
    }
  } catch (error) {
    console.error('❌ DEBUG: Add rating error:', error);
    console.error('❌ DEBUG: Error stack:', error.stack);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ratings/product/:productId
// @desc    Get all ratings for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    const ratings = await Rating.find({ productId })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      ratings,
      averageRating: product.averageRating,
      totalRatings: product.totalRatings
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/ratings/user/:productId
// @desc    Get user's rating for a specific product
// @access  Private
router.get('/user/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const rating = await Rating.findOne({ 
      userId: req.user._id, 
      productId 
    });

    res.json({ rating });
  } catch (error) {
    console.error('Get user rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/ratings/:productId
// @desc    Delete user's rating for a product
// @access  Private
router.delete('/:productId', auth, async (req, res) => {
  try {
    const { productId } = req.params;

    const deletedRating = await Rating.findOneAndDelete({ 
      userId: req.user._id, 
      productId 
    });

    if (!deletedRating) {
      return res.status(404).json({ message: 'Rating not found' });
    }

    // Update product average rating
    const allRatings = await Rating.find({ productId });
    let averageRating = 0;
    
    if (allRatings.length > 0) {
      const totalRating = allRatings.reduce((sum, r) => sum + r.rating, 0);
      averageRating = totalRating / allRatings.length;
    }

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      totalRatings: allRatings.length
    });

    res.json({
      message: 'Rating deleted successfully',
      averageRating: Math.round(averageRating * 10) / 10
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
