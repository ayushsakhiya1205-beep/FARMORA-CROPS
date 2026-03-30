import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StarRating = ({ 
  productId, 
  showAverage = false, 
  averageRating = 0, 
  totalRatings = 0,
  initialRating = 0,
  onRatingChange,
  readOnly = false 
}) => {
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [userHasRated, setUserHasRated] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

  useEffect(() => {
    if (initialRating > 0) {
      setUserRating(initialRating);
      setUserHasRated(true);
    }
  }, [initialRating]);

  const handleRatingClick = async (rating) => {
    if (isSubmitting) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      alert('❌ Please login to rate products');
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log('🔍 DEBUG: Submitting rating:', { productId, rating, hasToken: !!token });
      
      const response = await axios.post(
        `${API_URL}/api/ratings`,
        {
          productId,
          rating,
          review: review.trim()
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ DEBUG: Rating response:', response.data);

      setUserRating(rating);
      setUserHasRated(true);
      setIsSubmitting(false);
      setShowReviewForm(false);
      setReview('');
      
      if (onRatingChange) {
        onRatingChange(response.data.averageRating, response.data.rating);
      }

      alert('✅ Rating submitted successfully!');
    } catch (error) {
      setIsSubmitting(false);
      console.error('❌ DEBUG: Rating submission error:', error);
      console.error('❌ DEBUG: Error response:', error.response?.data);
      console.error('❌ DEBUG: Error status:', error.response?.status);
      console.error('❌ DEBUG: Error message:', error.message);
      
      let errorMessage = 'Failed to submit rating';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'Please login to rate products';
      } else if (error.response?.status === 403) {
        errorMessage = 'Access denied';
      } else if (error.response?.status === 404) {
        errorMessage = 'Product not found';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(`❌ ${errorMessage}`);
    }
  };

  const renderStars = (rating, interactive = false, readOnly = false) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <span
        key={star}
        className={`star ${star <= rating ? 'filled' : 'empty'} ${interactive ? 'interactive' : ''}`}
        onClick={interactive && !readOnly ? () => handleRatingClick(star) : undefined}
        onMouseEnter={interactive && !readOnly ? () => setHoverRating(star) : undefined}
        onMouseLeave={interactive && !readOnly ? () => setHoverRating(0) : undefined}
        style={{
          fontSize: interactive ? '24px' : '16px',
          color: star <= (interactive ? hoverRating || userRating : rating) ? '#ffc107' : '#ddd',
          cursor: interactive && !readOnly ? 'pointer' : 'default',
          transition: 'color 0.2s'
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <div className="star-rating-container">
      {/* Average Rating Display */}
      {showAverage && (
        <div className="average-rating">
          <div className="rating-stars">
            {renderStars(averageRating, false, true)}
          </div>
          <div className="rating-info">
            <span className="rating-value">{averageRating.toFixed(1)}</span>
            <span className="total-ratings">({totalRatings} {totalRatings === 1 ? 'rating' : 'ratings'})</span>
          </div>
        </div>
      )}

      {/* User Rating - Only show if not readOnly */}
      {!readOnly && (
        <div className="user-rating">
          <div className="rating-label">
            {userHasRated ? 'Your Rating:' : 'Rate this product:'}
          </div>
          <div className="rating-stars">
            {renderStars(userRating, !userHasRated)}
          </div>
          
          {!userHasRated && (
            <button
              className="review-btn"
              onClick={() => setShowReviewForm(!showReviewForm)}
              style={{
                marginLeft: '10px',
                padding: '5px 10px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showReviewForm ? 'Cancel' : 'Add Review'}
            </button>
          )}
          
          {showReviewForm && (
            <div className="review-form">
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review (optional)..."
                maxLength="500"
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginTop: '10px',
                  resize: 'vertical'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {review.length}/500 characters
              </div>
              <button
                onClick={handleRatingClick}
                disabled={isSubmitting || userRating === 0}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: isSubmitting || userRating === 0 ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isSubmitting || userRating === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StarRating;
