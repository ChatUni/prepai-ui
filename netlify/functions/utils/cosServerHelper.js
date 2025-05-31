import COS from 'cos-nodejs-sdk-v5';

let cosInstance = null;

// Initialize COS client as singleton with lazy loading
const getCosClient = () => {
  if (cosInstance) {
    return cosInstance;
  }

  if (!process.env.TENCENT_SECRETID || !process.env.TENCENT_SECRETKEY) {
    throw new Error('Missing required Tencent Cloud credentials');
  }

  cosInstance = new COS({
    SecretId: process.env.TENCENT_SECRETID,
    SecretKey: process.env.TENCENT_SECRETKEY,
    Protocol: 'https:'
  });

  return cosInstance;
};

// Common CORS headers
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Helper to create standardized response object
export const createResponse = (statusCode, body) => ({
  statusCode,
  headers: corsHeaders,
  body: JSON.stringify(body)
});

// Get default COS params
const getDefaultParams = () => {
  if (!process.env.TENCENT_BUCKET || !process.env.TENCENT_REGION) {
    throw new Error('Missing required Tencent Cloud configuration');
  }
  return {
    Bucket: process.env.TENCENT_BUCKET,
    Region: process.env.TENCENT_REGION
  };
};

// Get signed URL for object access
export const getSignedUrl = async (params) => {
  const cos = getCosClient();
  return new Promise((resolve, reject) => {
    cos.getObjectUrl({
      ...getDefaultParams(),
      ...params,
      Sign: true,
      Method: 'GET',
      Expires: 43200, // 12 hours
      Protocol: 'https:',
      Domain: `${process.env.TENCENT_BUCKET}.cos.${process.env.TENCENT_REGION}.myqcloud.com`
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Url);
      }
    });
  });
};

// Check if object exists in COS
export const checkObjectExists = async (params) => {
  const cos = getCosClient();
  return new Promise((resolve, reject) => {
    cos.headObject({
      ...getDefaultParams(),
      ...params
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Upload object to COS
export const uploadObject = async (params) => {
  const cos = getCosClient();
  return new Promise((resolve, reject) => {
    cos.putObject({
      ...getDefaultParams(),
      ...params
    }, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

// Extract key from COS URL
export const extractKeyFromUrl = (url) => {
  const { TENCENT_BUCKET, TENCENT_REGION } = process.env;
  if (!TENCENT_BUCKET || !TENCENT_REGION) {
    throw new Error('Missing required Tencent Cloud configuration');
  }
  const urlPattern = new RegExp(`https://${TENCENT_BUCKET}\\.cos\\.${TENCENT_REGION}\\.myqcloud\\.com/(.+?)(?:\\?|$)`);
  const match = url.match(urlPattern);
  
  if (!match) {
    throw new Error('Invalid COS URL format');
  }
  
  return decodeURIComponent(match[1]);
};

// Parse base64 file data
export const parseBase64File = (fileData) => {
  const contentType = fileData.match(/data:(.*);base64/)[1];
  const fileBuffer = Buffer.from(fileData.split(',')[1], 'base64');
  return { contentType, fileBuffer };
};

// Generate COS URL
export const generateCosUrl = (key) => {
  const { TENCENT_BUCKET, TENCENT_REGION } = process.env;
  if (!TENCENT_BUCKET || !TENCENT_REGION) {
    throw new Error('Missing required Tencent Cloud configuration');
  }
  return `https://${TENCENT_BUCKET}.cos.${TENCENT_REGION}.myqcloud.com/${key}`;
};

// High-level function to handle URL signing
export const handleUrlSigning = async (url) => {
  try {
    const key = extractKeyFromUrl(url);

    // Check if object exists
    try {
      await checkObjectExists({ Key: key });
    } catch (error) {
      console.error('Object does not exist:', error);
      return createResponse(404, { error: 'File not found' });
    }

    const signedUrl = await getSignedUrl({ Key: key });
    return createResponse(200, { url: signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return createResponse(500, { error: 'Failed to generate signed URL' });
  }
};

// High-level function to handle file upload
export const handleFileUpload = async (file, key) => {
  try {
    const { contentType, fileBuffer } = parseBase64File(file);

    // Upload the file
    await uploadObject({
      Key: key,
      Body: fileBuffer,
      ContentType: contentType
    });

    // Verify the upload was successful
    try {
      await checkObjectExists({ Key: key });
    } catch (error) {
      throw new Error('Upload verification failed');
    }

    const url = generateCosUrl(key);
    return createResponse(200, { url });
  } catch (error) {
    console.error('Error uploading to COS:', error);
    return createResponse(500, { error: 'Failed to upload file' });
  }
};
