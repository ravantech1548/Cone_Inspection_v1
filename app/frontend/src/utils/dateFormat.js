// India timezone (IST - Indian Standard Time, UTC+5:30)
const INDIA_TIMEZONE = 'Asia/Kolkata';

/**
 * Format timestamp to India timezone in format: "11/27/2025, 01:35:19 AM"
 * @param {string|Date} date - ISO string or Date object
 * @returns {string} Formatted date string in India timezone
 */
export const formatLocalDateTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Format: "11/27/2025, 01:35:19 AM" in India timezone
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: INDIA_TIMEZONE
  });
};

/**
 * Format timestamp to India timezone date only: "11/27/2025"
 * @param {string|Date} date - ISO string or Date object
 * @returns {string} Formatted date string in India timezone
 */
export const formatLocalDate = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Format: "11/27/2025" in India timezone
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: INDIA_TIMEZONE
  });
};

/**
 * Format timestamp to India timezone time only: "01:35:19 AM"
 * @param {string|Date} date - ISO string or Date object
 * @returns {string} Formatted time string in India timezone
 */
export const formatLocalTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  // Format: "01:35:19 AM" in India timezone
  return dateObj.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: INDIA_TIMEZONE
  });
};

