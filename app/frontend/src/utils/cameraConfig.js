/**
 * Camera capture configuration
 * 
 * CROP_WIDTH: Width of the rectangle region to extract from the center (in pixels)
 * CROP_HEIGHT: Height of the rectangle region to extract from the center (in pixels)
 * 
 * 📖 FULL DOCUMENTATION: See docs/CAMERA_CROP_CONFIGURATION.md for complete guide
 * 
 * Quick Configuration:
 * 1. Edit the CROP_WIDTH and CROP_HEIGHT values below, OR
 * 2. Set VITE_CAMERA_CROP_WIDTH and VITE_CAMERA_CROP_HEIGHT in your .env file
 *    Example: VITE_CAMERA_CROP_WIDTH=180
 *             VITE_CAMERA_CROP_HEIGHT=180
 * 
 * Common Sizes:
 * - 120x120 = Very small square (tight focus)
 * - 150x150 = Small square
 * - 180x180 = Medium square (DEFAULT)
 * - 240x240 = Large square
 * - 320x320 = Extra large square
 * - 256x192 = Small rectangle (4:3 aspect)
 * - 640x480 = Large rectangle (4:3 aspect)
 * 
 * After changing values, refresh your browser (Ctrl+Shift+R) to see the update.
 */
export const CAMERA_CONFIG = {
  // Crop a rectangle from the center of the image
  // Default: 180x180 pixels (small square to focus on cone tip)
  CROP_WIDTH: parseInt(import.meta.env.VITE_CAMERA_CROP_WIDTH || '180', 10),
  CROP_HEIGHT: parseInt(import.meta.env.VITE_CAMERA_CROP_HEIGHT || '180', 10),
  
  // Minimum crop dimensions to prevent errors
  MIN_CROP_WIDTH: 64,
  MIN_CROP_HEIGHT: 64,
  
  // Maximum crop dimensions (will be clamped to image dimensions)
  MAX_CROP_WIDTH: 2048,
  MAX_CROP_HEIGHT: 2048
};

