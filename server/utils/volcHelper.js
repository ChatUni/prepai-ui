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
const run_workflow = async (params) => {
  if (!process.env.COZE_API_TOKEN) {
    throw new Error('Missing required COZE_API_TOKEN environment variable');
  }

  const {
    workflow_id,
    parameters = {},
    baseURL = 'https://api.coze.cn'
  } = params;

  if (!workflow_id) {
    throw new Error('workflow_id is required to run Coze workflow');
  }

  try {
    const response = await fetch(`${baseURL}/v1/workflow/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COZE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        workflow_id,
        parameters
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
  handleFileDelete,
  jimeng,
  queryJimengTask,
  run_workflow,
  getVoiceOptions
};
