const COS = require('cos-nodejs-sdk-v5');

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
const getSignedUrl = async (params) => {
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
const checkObjectExists = async (params) => {
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

const verifyCOSParams = () => {
  const { TENCENT_BUCKET, TENCENT_REGION } = process.env;
  if (!TENCENT_BUCKET || !TENCENT_REGION) {
    throw new Error('Missing required Tencent Cloud configuration');
  }
};

// Upload object to COS
const uploadObject = async (params) => {
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
const extractKeyFromUrl = (url) => {
  verifyCOSParams();
  const urlPattern = new RegExp(`https://${process.env.TENCENT_BUCKET}\\.cos\\.${process.env.TENCENT_REGION}\\.myqcloud\\.com/(.+?)(?:\\?|$)`);
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error('Invalid COS URL format');
  }

  return decodeURIComponent(match[1]);
};

// Parse base64 file data
const parseBase64File = (fileData) => {
  const contentType = fileData.match(/data:(.*);base64/)[1];
  const fileBuffer = Buffer.from(fileData.split(',')[1], 'base64');
  return { contentType, fileBuffer };
};

// Generate COS URL
const generateCosUrl = (key) => {
  verifyCOSParams();
  return `https://${process.env.TENCENT_BUCKET}.cos.${process.env.TENCENT_REGION}.myqcloud.com/${key}`;
};

// High-level function to handle URL signing
const handleUrlSigning = async (url) => {
  const key = extractKeyFromUrl(url);

  // Check if object exists
  try {
    await checkObjectExists({ Key: key });
  } catch (error) {
    console.error('Object does not exist:', error);
    return createResponse(404, { error: 'File not found' });
  }

  const signedUrl = await getSignedUrl({ Key: key });
  return { url: signedUrl };
};

// High-level function to handle file upload
const handleFileUpload = async (file, key) => {
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
  return { url };
};

module.exports = {
  getSignedUrl,
  checkObjectExists,
  uploadObject,
  extractKeyFromUrl,
  parseBase64File,
  generateCosUrl,
  handleUrlSigning,
  handleFileUpload
};
