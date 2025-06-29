export const uploadToTOS = async (file, key) => {
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
    const response = await fetch('/.netlify/functions/api?type=tos_upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: fileBase64,
        key: key
      })
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    const data = await response.json();
    // Return the proxy URL for immediate access (backward compatible)
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
    const response = await fetch('/.netlify/functions/api?type=tos_upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: fileBase64,
        key: key
      })
    });

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
    const response = await fetch('/.netlify/functions/api?type=tos_sign', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error(`Failed to get signed URL with status: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    throw error;
  }
};