/**
 * Camera capture configuration
 * 
 * CROP_WIDTH: Width of the rectangle region to extract from the center (in pixels)
 * CROP_HEIGHT: Height of the rectangle region to extract from the center (in pixels)
 * 
 * To change the crop size:
 * 1. Edit the CROP_WIDTH and CROP_HEIGHT values below, OR
 * 2. Set VITE_CAMERA_CROP_WIDTH and VITE_CAMERA_CROP_HEIGHT in your .env file
 *    Example: VITE_CAMERA_CROP_WIDTH=256
 *             VITE_CAMERA_CROP_HEIGHT=192
 * 
 * Examples:
 * - 320x320 = square crop (320 pixels wide, 320 pixels tall)
 * - 256x192 = small rectangle (256 pixels wide, 192 pixels tall)
 * - 640x480 = larger rectangle (640 pixels wide, 480 pixels tall)
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

