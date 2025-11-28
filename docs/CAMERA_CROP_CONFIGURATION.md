# Camera Crop Image Size Configuration Guide

This guide explains how to configure the crop image size for the camera capture feature in the Textile Cone Inspection application.

## Overview

The camera capture feature extracts a rectangular region from the center of the camera feed before sending it to the inference service. This allows you to focus on the cone tip area and reduce the image size for faster processing.

## Configuration File Location

The configuration file is located at:
```
app/frontend/src/utils/cameraConfig.js
```

## Quick Configuration

### Method 1: Edit Configuration File Directly (Recommended)

1. Open the file: `app/frontend/src/utils/cameraConfig.js`
2. Find these lines (around lines 21-22):
   ```javascript
   CROP_WIDTH: parseInt(import.meta.env.VITE_CAMERA_CROP_WIDTH || '180', 10),
   CROP_HEIGHT: parseInt(import.meta.env.VITE_CAMERA_CROP_HEIGHT || '180', 10),
   ```
3. Change the default values (the numbers inside the quotes):
   - `'180'` = width in pixels
   - `'180'` = height in pixels
4. Save the file
5. **Refresh your browser** (hard refresh: `Ctrl+Shift+R` or `F5`)

**Example:** To set a 150x150 pixel crop:
```javascript
CROP_WIDTH: parseInt(import.meta.env.VITE_CAMERA_CROP_WIDTH || '150', 10),
CROP_HEIGHT: parseInt(import.meta.env.VITE_CAMERA_CROP_HEIGHT || '150', 10),
```

### Method 2: Use Environment Variables

1. Create or edit the `.env` file in the project root directory
2. Add these lines:
   ```env
   VITE_CAMERA_CROP_WIDTH=180
   VITE_CAMERA_CROP_HEIGHT=180
   ```
3. Replace the numbers with your desired dimensions
4. **Restart the frontend development server** for changes to take effect

**Note:** Environment variables take precedence over the default values in the config file.

## Configuration Parameters

### Main Parameters

| Parameter | Description | Default | Range |
|-----------|-------------|---------|-------|
| `CROP_WIDTH` | Width of the crop rectangle in pixels | `180` | 64 - 2048 |
| `CROP_HEIGHT` | Height of the crop rectangle in pixels | `180` | 64 - 2048 |

### Safety Limits

| Parameter | Description | Value |
|-----------|-------------|-------|
| `MIN_CROP_WIDTH` | Minimum allowed width | `64` pixels |
| `MIN_CROP_HEIGHT` | Minimum allowed height | `64` pixels |
| `MAX_CROP_WIDTH` | Maximum allowed width | `2048` pixels |
| `MAX_CROP_HEIGHT` | Maximum allowed height | `2048` pixels |

**Note:** If you set dimensions larger than the camera image size, they will be automatically clamped to fit.

## Common Image Size Presets

### Square Crops (Width = Height)

| Size | CROP_WIDTH | CROP_HEIGHT | Use Case |
|------|------------|-------------|----------|
| Very Small | `120` | `120` | Tight focus on small cone tips |
| Small | `150` | `150` | Small cone tips |
| Medium | `180` | `180` | **Default** - Standard cone tips |
| Large | `240` | `240` | Larger cone tips |
| Extra Large | `320` | `320` | Very large cone tips |
| Maximum | `640` | `640` | Full detail capture |

### Rectangular Crops (Width ≠ Height)

| Size | CROP_WIDTH | CROP_HEIGHT | Aspect Ratio | Use Case |
|------|------------|-------------|--------------|----------|
| Small Wide | `200` | `150` | 4:3 | Wide cone tips |
| Medium Wide | `320` | `240` | 4:3 | Standard wide format |
| Large Wide | `640` | `480` | 4:3 | High-res wide format |
| Small Tall | `150` | `200` | 3:4 | Tall cone tips |
| Medium Tall | `240` | `320` | 3:4 | Standard tall format |
| Large Tall | `480` | `640` | 3:4 | High-res tall format |
| Ultra Wide | `400` | `200` | 2:1 | Very wide cone tips |
| Ultra Tall | `200` | `400` | 1:2 | Very tall cone tips |

### Recommended Sizes for Different Camera Resolutions

| Camera Resolution | Recommended Crop Size | Reason |
|-------------------|----------------------|--------|
| 320x240 | `120x120` to `150x150` | Small camera, tight crop |
| 640x480 | `180x180` to `240x240` | **Most common** - Good balance |
| 1280x720 (720p) | `240x240` to `320x320` | Higher resolution, larger crop |
| 1920x1080 (1080p) | `320x320` to `480x480` | High resolution, detailed crop |

## Step-by-Step Configuration Examples

### Example 1: Set Small Square Crop (150x150)

**Option A: Edit Config File**
1. Open `app/frontend/src/utils/cameraConfig.js`
2. Change line 21: `'180'` → `'150'`
3. Change line 22: `'180'` → `'150'`
4. Save and refresh browser

**Option B: Use Environment Variable**
1. Add to `.env`:
   ```env
   VITE_CAMERA_CROP_WIDTH=150
   VITE_CAMERA_CROP_HEIGHT=150
   ```
2. Restart frontend server

### Example 2: Set Rectangular Crop (256x192)

**Option A: Edit Config File**
1. Open `app/frontend/src/utils/cameraConfig.js`
2. Change line 21: `'180'` → `'256'`
3. Change line 22: `'180'` → `'192'`
4. Save and refresh browser

**Option B: Use Environment Variable**
1. Add to `.env`:
   ```env
   VITE_CAMERA_CROP_WIDTH=256
   VITE_CAMERA_CROP_HEIGHT=192
   ```
2. Restart frontend server

### Example 3: Set Large Square Crop (320x320)

**Option A: Edit Config File**
1. Open `app/frontend/src/utils/cameraConfig.js`
2. Change line 21: `'180'` → `'320'`
3. Change line 22: `'180'` → `'320'`
4. Save and refresh browser

**Option B: Use Environment Variable**
1. Add to `.env`:
   ```env
   VITE_CAMERA_CROP_WIDTH=320
   VITE_CAMERA_CROP_HEIGHT=320
   ```
2. Restart frontend server

## Visual Feedback

When the camera is active, you will see a **green rectangular overlay** on the camera preview showing exactly what area will be captured. This overlay:
- Updates automatically when you change the configuration
- Shows corner markers for better visibility
- Adjusts proportionally to the camera feed size

## How It Works

1. **Camera Capture**: The full camera feed is captured
2. **Center Calculation**: The crop rectangle is centered on the image
3. **Extraction**: Only the rectangular region is extracted
4. **Processing**: The cropped image is sent to the inference service

The crop position is calculated as:
- `cropX = (imageWidth - cropWidth) / 2`
- `cropY = (imageHeight - cropHeight) / 2`

## Troubleshooting

### Crop Size Too Large
**Problem:** Crop dimensions exceed camera image size  
**Solution:** The system automatically clamps to fit. Check console logs for warnings.

### Crop Not Visible
**Problem:** Green overlay not showing  
**Solution:** 
1. Ensure camera is started
2. Check browser console for errors
3. Verify video dimensions are > 0

### Changes Not Taking Effect
**Problem:** Configuration changes don't appear  
**Solution:**
1. **Hard refresh browser** (`Ctrl+Shift+R` or `F5`)
2. If using environment variables, **restart the frontend server**
3. Clear browser cache if needed

### Crop Too Small/Large
**Problem:** Need to adjust size  
**Solution:** 
- For smaller: Reduce both `CROP_WIDTH` and `CROP_HEIGHT` values
- For larger: Increase both values
- See "Common Image Size Presets" section above for recommendations

## Best Practices

1. **Start Small**: Begin with a smaller crop (150x150) and increase if needed
2. **Match Camera Resolution**: Use crop sizes appropriate for your camera resolution
3. **Square vs Rectangle**: 
   - Use square crops for symmetric cone tips
   - Use rectangular crops for elongated or asymmetric tips
4. **Test Different Sizes**: Experiment to find the optimal size for your specific use case
5. **Monitor Performance**: Smaller crops process faster but may miss important details

## Technical Details

- **Format**: The cropped image is always sent as JPEG
- **Quality**: JPEG quality is set to 95% (high quality)
- **Processing**: Cropping happens client-side before upload
- **Validation**: Dimensions are validated against min/max limits
- **Auto-adjustment**: Crop size is automatically adjusted if it exceeds source image dimensions

## Related Files

- Configuration: `app/frontend/src/utils/cameraConfig.js`
- Implementation: `app/frontend/src/pages/InspectionPage.jsx`
- Environment: `.env` (project root)

## Support

If you encounter issues:
1. Check browser console for error messages
2. Verify configuration file syntax is correct
3. Ensure values are within the allowed range (64-2048)
4. Review the troubleshooting section above

---

**Last Updated:** Configuration supports both square and rectangular crops with flexible sizing options.

