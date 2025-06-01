import { tap } from "../../netlify/functions/utils/util";

export const uploadToCOS = async (file, key) => {
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
    const response = await fetch('/.netlify/functions/api?type=cos_upload', {
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
    return data.url;
  } catch (error) {
    console.error('Error uploading to COS:', error);
    throw error;
  }
};

export const getSignedUrl = async (url) => {
  try {
    const response = await fetch('/.netlify/functions/api?type=cos_sign', {
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