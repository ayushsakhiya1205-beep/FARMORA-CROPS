// Backend API URL
export const API_URL = "https://farmora-crops.onrender.com";

// Helper function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // Otherwise, prepend backend URL
  return `${API_URL}${imagePath}`;
};


