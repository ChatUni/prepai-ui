import { post } from "./db";

export const uploadToTOS = async (file, key) => {
  try {
    const reader = new FileReader();
    const fileBase64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    const fileBase64 = await fileBase64Promise;

    const data = await post('tos_upload', {}, { file: fileBase64, key: key });
    return data.url;
  } catch (error) {
    console.error('Error uploading to TOS:', error);
    throw error;
  }
};

// Enhanced version that returns full upload info
export const uploadToTOSWithDetails = async (file, key) => {
  try {
    // Convert file to base64
    const reader = new FileReader();
    const fileBase64Promise = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    const fileBase64 = await fileBase64Promise;

    // Upload via serverless function
    const response = await post('tos_upload', {}, { file: fileBase64, key: key });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    // Return full upload details
    return {
      url: data.url, // proxy URL for immediate access
      directUrl: data.directUrl, // direct URL (may need proxy for access)
      key: data.key // object key for future operations
    };
  } catch (error) {
    console.error('Error uploading to TOS:', error);
    throw error;
  }
};

export const getSignedUrl = async (url) => {
  try {
    const data = await post('tos_sign', {}, { url });
    return data.url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};

// Extract key from TOS URL for deletion
export const extractKeyFromUrl = (url) => {
  try {
    // Handle different URL formats that might be returned by TOS
    // Example: https://bucket.tos-region.volces.com/clients/1/banners/image.jpg
    // or custom endpoint: https://custom.domain.com/clients/1/banners/image.jpg
    
    // First try to extract from standard TOS URL format
    const tosPattern = /\.tos-[^.]+\.volces\.com\/(.+?)(?:\?|$)/;
    let match = url.match(tosPattern);
    
    if (match) {
      return decodeURIComponent(match[1]);
    }
    
    // If not standard format, try to extract from custom endpoint
    // Look for pattern after domain/path
    const customPattern = /\/([^/]+\/[^/]+\/[^/]+\/[^/?]+)(?:\?|$)/;
    match = url.match(customPattern);
    
    if (match) {
      return decodeURIComponent(match[1]);
    }
    
    // Fallback: extract everything after the last domain part
    const urlParts = url.split('/');
    if (urlParts.length >= 4) {
      // Assume format: protocol://domain/key/path
      return urlParts.slice(3).join('/').split('?')[0];
    }
    
    throw new Error('Unable to extract key from URL');
  } catch (error) {
    console.error('Error extracting key from URL:', error);
    throw new Error(`Invalid TOS URL format: ${url}`);
  }
};

export const deleteImage = async (key) => {
  try {
    const data = await post('tos_delete', {}, { key });
    return data;
  } catch (error) {
    console.error('Error deleting from TOS:', error);
    throw error;
  }
};