const { TosClient } = require('@volcengine/tos-sdk');

let tosInstance = null;

// Initialize TOS client as singleton with lazy loading
const getTosClient = () => {
  if (tosInstance) {
    return tosInstance;
  }

  if (!process.env.VOLC_ACCESSKEY || !process.env.VOLC_SECRETKEY) {
    throw new Error('Missing required Volcano Engine credentials');
  }

  tosInstance = new TosClient({
    accessKeyId: process.env.VOLC_ACCESSKEY,
    accessKeySecret: process.env.VOLC_SECRETKEY,
    region: process.env.VOLC_REGION || 'cn-beijing',
    endpoint: process.env.VOLC_ENDPOINT
  });

  return tosInstance;
};

// Get default TOS params
const getDefaultParams = () => {
  if (!process.env.VOLC_BUCKET || !process.env.VOLC_REGION) {
    throw new Error('Missing required Volcano Engine configuration');
  }
  return {
    bucket: process.env.VOLC_BUCKET,
    region: process.env.VOLC_REGION
  };
};

// Get signed URL for object access
const getSignedUrl = async (params) => {
  const tos = getTosClient();
  const defaultParams = getDefaultParams();
  
  try {
    const result = await tos.preSignedURL('GET', {
      bucket: defaultParams.bucket,
      key: params.Key,
      expires: params.Expires || 43200 // 12 hours default
    });
    return result.signedUrl;
  } catch (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

// Check if object exists in TOS
const checkObjectExists = async (params) => {
  const tos = getTosClient();
  const defaultParams = getDefaultParams();
  
  try {
    const result = await tos.headObject({
      bucket: defaultParams.bucket,
      key: params.Key
    });
    return result;
  } catch (error) {
    if (error.statusCode === 404) {
      throw new Error('Object not found');
    }
    throw error;
  }
};

const verifyTOSParams = () => {
  const { VOLC_BUCKET, VOLC_REGION } = process.env;
  if (!VOLC_BUCKET || !VOLC_REGION) {
    throw new Error('Missing required Volcano Engine configuration');
  }
};

// Upload object to TOS
const uploadObject = async (params) => {
  const tos = getTosClient();
  const defaultParams = getDefaultParams();
  
  try {
    const result = await tos.putObject({
      bucket: defaultParams.bucket,
      key: params.Key,
      body: params.Body,
      contentType: params.ContentType,
      contentLength: params.Body.length
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to upload object: ${error.message}`);
  }
};

// Extract key from TOS URL
const extractKeyFromUrl = (url) => {
  verifyTOSParams();
  const { VOLC_BUCKET, VOLC_REGION, VOLC_ENDPOINT } = process.env;
  
  // Handle custom endpoint or default TOS endpoint
  const baseUrl = VOLC_ENDPOINT || `https://${VOLC_BUCKET}.tos-${VOLC_REGION}.volces.com`;
  const urlPattern = new RegExp(`${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(.+?)(?:\\?|$)`);
  const match = url.match(urlPattern);

  if (!match) {
    throw new Error('Invalid TOS URL format');
  }

  return decodeURIComponent(match[1]);
};

// Parse base64 file data
const parseBase64File = (fileData) => {
  const contentType = fileData.match(/data:(.*);base64/)[1];
  const fileBuffer = Buffer.from(fileData.split(',')[1], 'base64');
  return { contentType, fileBuffer };
};

// Generate TOS URL
const generateTosUrl = (key) => {
  verifyTOSParams();
  const { VOLC_BUCKET, VOLC_REGION, VOLC_ENDPOINT } = process.env;
  
  if (VOLC_ENDPOINT) {
    return `${VOLC_ENDPOINT}/${key}`;
  }
  
  return `https://${VOLC_BUCKET}.tos-${VOLC_REGION}.volces.com/${key}`;
};

// High-level function to handle URL signing
const handleUrlSigning = async (url) => {
  const key = extractKeyFromUrl(url);

  // Check if object exists
  try {
    await checkObjectExists({ Key: key });
  } catch (error) {
    console.error('Object does not exist:', error);
    return { error: 'File not found', status: 404 };
  }

  try {
    const signedUrl = await getSignedUrl({ Key: key });
    return { url: signedUrl };
  } catch (error) {
    console.error('Failed to generate signed URL:', error);
    return { error: 'Failed to generate signed URL', status: 500 };
  }
};

// High-level function to handle file upload
const handleFileUpload = async (file, key) => {
  const { contentType, fileBuffer } = parseBase64File(file);

  // Extract file extension and base path
  const lastDotIndex = key.lastIndexOf('.');
  const basePath = lastDotIndex !== -1 ? key.substring(0, lastDotIndex) : key;
  const extension = lastDotIndex !== -1 ? key.substring(lastDotIndex) : '';
  
  // Generate timestamp and create new key
  const timestamp = Date.now();
  const timestampedKey = `${basePath}-${timestamp}${extension}`;

  // Find and delete existing files with same base path but different timestamps
  try {
    const listResult = await listObjects({
      Prefix: basePath + '-'
    });
    
    if (listResult.contents && listResult.contents.length > 0) {
      // Filter files that match the pattern: basePath-{timestamp}.extension
      const pattern = new RegExp(`^${basePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-\\d+${extension.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
      const filesToDelete = listResult.contents.filter(obj => pattern.test(obj.key));
      
      // Delete existing files
      for (const fileObj of filesToDelete) {
        try {
          await deleteObject({ Key: fileObj.key });
        } catch (deleteError) {
          console.warn(`Failed to delete existing file ${fileObj.key}:`, deleteError.message);
          // Continue with upload even if deletion fails
        }
      }
    }
  } catch (listError) {
    console.warn('Failed to list existing files:', listError.message);
    // Continue with upload even if listing fails
  }

  // Upload the file with timestamped key
  try {
    await uploadObject({
      Key: timestampedKey,
      Body: fileBuffer,
      ContentType: contentType
    });
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Verify the upload was successful
  try {
    await checkObjectExists({ Key: timestampedKey });
  } catch (error) {
    throw new Error('Upload verification failed');
  }

  const url = generateTosUrl(timestampedKey);
  return { url };
};

// High-level function to handle file deletion
const handleFileDelete = async (key) => {
  try {
    // Check if object exists before attempting to delete
    await checkObjectExists({ Key: key });
    
    // Delete the object
    await deleteObject({ Key: key });
    
    return { success: true, message: 'File deleted successfully' };
  } catch (error) {
    if (error.message.includes('Object not found')) {
      return { success: true, message: 'File already deleted or does not exist' };
    }
    throw new Error(`Delete failed: ${error.message}`);
  }
};

// Delete object from TOS
const deleteObject = async (params) => {
  const tos = getTosClient();
  const defaultParams = getDefaultParams();
  
  try {
    const result = await tos.deleteObject({
      bucket: defaultParams.bucket,
      key: params.Key
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to delete object: ${error.message}`);
  }
};

// List objects in TOS bucket
const listObjects = async (params = {}) => {
  const tos = getTosClient();
  const defaultParams = getDefaultParams();
  
  try {
    const result = await tos.listObjects({
      bucket: defaultParams.bucket,
      prefix: params.Prefix || '',
      maxKeys: params.MaxKeys || 1000,
      marker: params.Marker || ''
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to list objects: ${error.message}`);
  }
};

// Copy object within TOS
const copyObject = async (params) => {
  const tos = getTosClient();
  const defaultParams = getDefaultParams();
  
  try {
    const result = await tos.copyObject({
      bucket: defaultParams.bucket,
      key: params.DestinationKey,
      srcBucket: params.SourceBucket || defaultParams.bucket,
      srcKey: params.SourceKey
    });
    return result;
  } catch (error) {
    throw new Error(`Failed to copy object: ${error.message}`);
  }
};

module.exports = {
  getSignedUrl,
  checkObjectExists,
  uploadObject,
  deleteObject,
  listObjects,
  copyObject,
  extractKeyFromUrl,
  parseBase64File,
  generateTosUrl,
  handleUrlSigning,
  handleFileUpload,
  handleFileDelete
};
