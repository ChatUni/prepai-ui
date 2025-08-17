const { TosClient } = require('@volcengine/tos-sdk');
const crypto = require('crypto');
const { voices } = require('./volcVoices.js');

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

// Get all files in a specified folder on TOS
const getAllFilesInFolder = async (folder = '') => {
  const tos = getTosClient();
  const defaultParams = getDefaultParams();
  
  // Ensure folder path ends with '/' if it's not empty and doesn't already end with '/'
  const normalizedFolderPath = folder && !folder.endsWith('/') ? `${folder}/` : folder;
  
  let allFiles = [];
  let marker = '';
  let hasMore = true;
  
  try {
    while (hasMore) {
      const result = await tos.listObjects({
        bucket: defaultParams.bucket,
        prefix: normalizedFolderPath,
        maxKeys: 1000,
        marker: marker
      });

      if (result.data.Contents && result.data.Contents.length > 0) {
        // Filter out folder entries (keys ending with '/') to return only files
        const files = result.data.Contents
          .filter(item => !item.Key.endsWith('/'))
          .map(item => ({
            size: item.Size,
            lastModified: item.LastModified,
            fileName: item.Key.split('/').pop(),
          }));
        
        allFiles = allFiles.concat(files);
      }
      
      // Check if there are more objects to fetch
      hasMore = result.isTruncated;
      if (hasMore && result.nextMarker) {
        marker = result.nextMarker;
      } else {
        hasMore = false;
      }
    }
    
    return allFiles;
  } catch (error) {
    throw new Error(`Failed to list files in folder '${folder}': ${error.message}`);
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

// Generate signature for Volcano Engine API requests
const generateSignature = (method, uri, query, headers, body, timestamp) => {
  const accessKeySecret = process.env.VOLC_SECRETKEY;
  if (!accessKeySecret) {
    throw new Error('Missing VOLC_SECRETKEY for API signature');
  }

  // Create canonical request
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map(key => `${key.toLowerCase()}:${headers[key]}`)
    .join('\n');
  
  const signedHeaders = Object.keys(headers)
    .sort()
    .map(key => key.toLowerCase())
    .join(';');

  const hashedPayload = crypto.createHash('sha256').update(body || '').digest('hex');
  
  const canonicalRequest = [
    method,
    uri,
    query || '',
    canonicalHeaders,
    '',
    signedHeaders,
    hashedPayload
  ].join('\n');

  // Create string to sign
  const algorithm = 'HMAC-SHA256';
  const credentialScope = `${timestamp.slice(0, 8)}/cn-north-1/cv/request`;
  const hashedCanonicalRequest = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
  
  const stringToSign = [
    algorithm,
    timestamp,
    credentialScope,
    hashedCanonicalRequest
  ].join('\n');

  // Calculate signature
  const kDate = crypto.createHmac('sha256', accessKeySecret).update(timestamp.slice(0, 8)).digest();
  const kRegion = crypto.createHmac('sha256', kDate).update('cn-north-1').digest();
  const kService = crypto.createHmac('sha256', kRegion).update('cv').digest();
  const kSigning = crypto.createHmac('sha256', kService).update('request').digest();
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  return signature;
};

// Call JiMeng API for video generation
const jimeng = async (params) => {
  if (!process.env.VOLC_ACCESSKEY || !process.env.VOLC_SECRETKEY) {
    throw new Error('Missing required Volcano Engine credentials for JiMeng API');
  }

  const {
    prompt,
    model = 'jimeng-1.4',
    aspect_ratio = '16:9',
    duration = 5,
    seed,
    callback_url
  } = params;

  if (!prompt) {
    throw new Error('Prompt is required for video generation');
  }

  const endpoint = 'https://visual.volcengineapi.com';
  const uri = '/';
  const method = 'POST';
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  // Query parameters for Action and Version
  const queryParams = new URLSearchParams({
    Action: 'CVSync2AsyncSubmitTask',
    Version: '2022-08-31'
  });
  
  const requestBody = {
    req_key: `jimeng_vgfm_t2v_l20`,
    prompt,
    model,
    aspect_ratio,
    duration,
    ...(seed && { seed }),
    ...(callback_url && { callback_url })
  };

  const body = JSON.stringify(requestBody);
  const query = queryParams.toString();
  
  const headers = {
    'Content-Type': 'application/json',
    'Host': 'visual.volcengineapi.com',
    'X-Date': timestamp,
    'X-Content-Sha256': crypto.createHash('sha256').update(body).digest('hex')
  };

  try {
    const signature = generateSignature(method, uri, query, headers, body, timestamp);
    
    const accessKeyId = process.env.VOLC_ACCESSKEY;
    const credentialScope = `${timestamp.slice(0, 8)}/cn-north-1/cv/request`;
    const signedHeaders = Object.keys(headers).sort().map(key => key.toLowerCase()).join(';');
    
    headers['Authorization'] = `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`${endpoint}${uri}?${query}`, {
      method,
      headers,
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JiMeng API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Failed to call JiMeng API: ${error.message}`);
  }
};

// Query JiMeng task status
const queryJimengTask = async (task_id) => {
  if (!process.env.VOLC_ACCESSKEY || !process.env.VOLC_SECRETKEY) {
    throw new Error('Missing required Volcano Engine credentials for JiMeng API');
  }

  if (!task_id) {
    throw new Error('Task ID is required to query task status');
  }

  const endpoint = 'https://visual.volcengineapi.com';
  const uri = '/';
  const method = 'POST';
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
  
  // Query parameters for Action and Version
  const queryParams = new URLSearchParams({
    Action: 'CVSync2AsyncGetResult',
    Version: '2022-08-31'
  });
  
  const requestBody = {
    req_key: 'jimeng_vgfm_t2v_l20',
    task_id
  };

  const body = JSON.stringify(requestBody);
  const query = queryParams.toString();
  
  const headers = {
    'Content-Type': 'application/json',
    'Host': 'visual.volcengineapi.com',
    'X-Date': timestamp,
    'X-Content-Sha256': crypto.createHash('sha256').update(body).digest('hex')
  };

  try {
    const signature = generateSignature(method, uri, query, headers, body, timestamp);
    
    const accessKeyId = process.env.VOLC_ACCESSKEY;
    const credentialScope = `${timestamp.slice(0, 8)}/cn-north-1/cv/request`;
    const signedHeaders = Object.keys(headers).sort().map(key => key.toLowerCase()).join(';');
    
    headers['Authorization'] = `HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const response = await fetch(`${endpoint}${uri}?${query}`, {
      method,
      headers,
      body
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`JiMeng query request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Failed to query JiMeng task: ${error.message}`);
  }
};

// Run Coze workflow
const run_workflow = async (workflow_id, parameters) => {
  if (!process.env.COZE_API_TOKEN) {
    throw new Error('Missing required COZE_API_TOKEN environment variable');
  }

  if (!workflow_id) {
    throw new Error('workflow_id is required to run Coze workflow');
  }

  let uploadedFileKeys = [];
console.log(parameters)  
  try {
    // Process file parameters first - upload files to TOS and replace with URLs
    const processedParameters = await processFileParameters(parameters, 'workflow-temp');
    
    // Track uploaded files for cleanup
    uploadedFileKeys = extractUploadedFileKeys(parameters, processedParameters);
    
    if (uploadedFileKeys.length > 0) {
      console.log(`Uploaded ${uploadedFileKeys.length} temporary files for workflow ${workflow_id}`);
    }

    const response = await fetch(`https://api.coze.cn/v1/workflow/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id,
        parameters: processedParameters
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Coze API request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    throw new Error(`Failed to run Coze workflow: ${error.message}`);
  } finally {
    // Clean up temporary files regardless of success or failure
    if (uploadedFileKeys.length > 0) {
      cleanupTempFiles(uploadedFileKeys).catch(error => {
        console.error('Failed to cleanup temporary files:', error.message);
      });
    }
  }
};

// Get voice options from TTS configuration
const getVoiceOptions = async () => {
  return voices;

  const url = 'https://lf3-config.bytetcc.com/obj/tcc-config-web/tcc-v2-data-lab.speech.tts_middle_layer-default';
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch voice options: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();

    // Extract and return the voice options list
    if (result?.data?.volc_bigtts) {
      const opts = JSON.parse(result.data.volc_bigtts).voice_options
      return opts
        .sort((a, b) => {
          // First sort by avatar presence (those with avatars first)
          const aHasAvatar = !!a.avatar;
          const bHasAvatar = !!b.avatar;
          return bHasAvatar - aHasAvatar;
          // if (aHasAvatar !== bHasAvatar) {
          //   return bHasAvatar - aHasAvatar;
          // }
          // // Then sort by Chinese names first, then alphabetically
          // const aIsChinese = /[\u4e00-\u9fff]/.test(a.name);
          // const bIsChinese = /[\u4e00-\u9fff]/.test(b.name);
          // if (aIsChinese !== bIsChinese) {
          //   return bIsChinese - aIsChinese;
          // }
          // // Finally sort alphabetically within each group
          // return a.name.localeCompare(b.name);
        })
        .map(x => ({
          text: `${x.name} (${x.gender} - ${x.age})`,
          value: x.voice_config[0].params.voice_type,
          icon: x.avatar,
          url: x.trial_url
        }))
    } else {
      throw new Error('Voice options not found in response data structure');
    }
  } catch (error) {
    throw new Error(`Failed to get voice options: ${error.message}`);
  }
};

// Check if an object is a File object
const isFileObject = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  
  // Check for browser File object properties
  if (obj instanceof File) return true;
  
  // Check for base64 data URL pattern
  if (typeof obj === 'string' && obj.startsWith('data:') && obj.includes('base64,')) return true;
  
  // Check for object with file-like properties
  if (obj.name && obj.type && (obj.size !== undefined || obj.data)) return true;
  
  // Check for Buffer
  if (Buffer.isBuffer(obj)) return true;
  
  return false;
};

// Generate a unique key for file upload
const generateFileKey = (originalName, prefix = 'uploads') => {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  if (originalName) {
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    return `${prefix}/${baseName}-${timestamp}-${randomSuffix}.${extension}`;
  }
  
  return `${prefix}/file-${timestamp}-${randomSuffix}`;
};

// Process File objects in parameters and upload to TOS
const processFileParameters = async (params, keyPrefix = 'uploads') => {
  if (!params || typeof params !== 'object') {
    return params;
  }

  // Handle arrays
  if (Array.isArray(params)) {
    const processedArray = [];
    for (let i = 0; i < params.length; i++) {
      processedArray[i] = await processFileParameters(params[i], keyPrefix);
    }
    return processedArray;
  }

  // Handle objects
  const processedParams = {};
  
  for (const [key, value] of Object.entries(params)) {
    if (isFileObject(value)) {
      try {
        let fileData, fileName;
        
        // Handle different file object types
        if (typeof value === 'string' && value.startsWith('data:')) {
          // Base64 data URL
          fileData = value;
          fileName = `${key}.${value.split(';')[0].split('/')[1] || 'bin'}`;
        } else if (Buffer.isBuffer(value)) {
          // Buffer object - convert to base64 data URL
          const mimeType = 'application/octet-stream'; // Default MIME type
          const base64Data = value.toString('base64');
          fileData = `data:${mimeType};base64,${base64Data}`;
          fileName = `${key}.bin`;
        } else if (value.name && value.type) {
          // File-like object with name and type
          fileName = value.name;
          if (value.data) {
            // Object with data property
            if (typeof value.data === 'string' && value.data.startsWith('data:')) {
              fileData = value.data;
            } else {
              // Assume it's base64 or binary data
              const base64Data = Buffer.isBuffer(value.data) ?
                value.data.toString('base64') :
                Buffer.from(value.data).toString('base64');
              fileData = `data:${value.type};base64,${base64Data}`;
            }
          } else {
            throw new Error(`File object for key "${key}" is missing data`);
          }
        } else {
          throw new Error(`Unsupported file object format for key "${key}"`);
        }
        
        // Generate unique key for upload
        const uploadKey = generateFileKey(fileName, keyPrefix);
        
        // Upload file to TOS
        const uploadResult = await handleFileUpload(fileData, uploadKey);
        
        // Replace file object with URL
        processedParams[key] = uploadResult.url;
        
        console.log(`Uploaded file for parameter "${key}" to: ${uploadResult.url}`);
        
      } catch (error) {
        console.error(`Failed to upload file for parameter "${key}":`, error.message);
        throw new Error(`File upload failed for parameter "${key}": ${error.message}`);
      }
    } else if (value && typeof value === 'object') {
      // Recursively process nested objects
      processedParams[key] = await processFileParameters(value, keyPrefix);
    } else {
      // Keep non-file values as-is
      processedParams[key] = value;
    }
  }
  
  return processedParams;
};

// Track uploaded files and extract their keys for cleanup
const extractUploadedFileKeys = (originalParams, processedParams) => {
  const uploadedKeys = [];
  
  const extractKeys = (original, processed) => {
    if (!original || !processed || typeof original !== 'object' || typeof processed !== 'object') {
      return;
    }
    
    if (Array.isArray(original) && Array.isArray(processed)) {
      for (let i = 0; i < original.length && i < processed.length; i++) {
        extractKeys(original[i], processed[i]);
      }
      return;
    }
    
    for (const [key, originalValue] of Object.entries(original)) {
      const processedValue = processed[key];
      
      if (isFileObject(originalValue) && typeof processedValue === 'string' && processedValue.includes('tos-')) {
        try {
          const fileKey = extractKeyFromUrl(processedValue);
          uploadedKeys.push(fileKey);
        } catch (error) {
          console.warn(`Failed to extract key from URL ${processedValue}:`, error.message);
        }
      } else if (originalValue && typeof originalValue === 'object' && processedValue && typeof processedValue === 'object') {
        extractKeys(originalValue, processedValue);
      }
    }
  };
  
  extractKeys(originalParams, processedParams);
  return uploadedKeys;
};

// Clean up uploaded temporary files
const cleanupTempFiles = async (fileKeys) => {
  if (!fileKeys || fileKeys.length === 0) {
    return;
  }
  
  console.log(`Cleaning up ${fileKeys.length} temporary files from TOS`);
  
  for (const key of fileKeys) {
    try {
      await deleteObject({ Key: key });
      console.log(`Deleted temporary file: ${key}`);
    } catch (error) {
      console.warn(`Failed to delete temporary file ${key}:`, error.message);
      // Continue cleanup even if individual deletions fail
    }
  }
};

module.exports = {
  getSignedUrl,
  checkObjectExists,
  uploadObject,
  deleteObject,
  listObjects,
  getAllFilesInFolder,
  copyObject,
  extractKeyFromUrl,
  parseBase64File,
  generateTosUrl,
  handleUrlSigning,
  handleFileUpload,
  handleFileDelete,
  jimeng,
  queryJimengTask,
  run_workflow,
  getVoiceOptions,
  processFileParameters,
  isFileObject,
  generateFileKey,
  extractUploadedFileKeys,
  cleanupTempFiles
};
