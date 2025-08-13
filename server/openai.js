const OpenAI = require('openai');
const { parsePathParams } = require('./utils/pathUtils.js');
const { parse } = require('multipart-formdata');
const { headers: getResponseHeaders } = require('./utils/http.js');
const fs = require('fs');
const path = require('path');
const { toFile } = require('openai');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const CHATGPT_MODEL = 'gpt-5-mini';
const isGPT5 = CHATGPT_MODEL.includes('gpt-5');

// Chat function that can be called from other modules
const chat = async (apiType, body, serverless = true) => {
  const useOpenRouter = apiType === 'openrouter';
  const headers = getResponseHeaders();
console.log('OpenRouter: ', useOpenRouter)
  // Initialize appropriate client based on API choice
  if (useOpenRouter) {
    if (!process.env.OPENROUTER_API_KEY) {
      const error = new Error('OpenRouter API key not configured');
      if (!serverless) throw error;
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  } else {
    if (!process.env.OPENAI_API_KEY) {
      const error = new Error('OpenAI API key not configured');
      if (!serverless) throw error;
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  const openai = useOpenRouter ? null : new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const { messages, model } = body;
    
    if (!messages || !Array.isArray(messages)) {
      const error = new Error('Messages array is required');
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    if (useOpenRouter) {
      if (!model) {
        const error = new Error('Model is required for OpenRouter');
        if (!serverless) throw error;
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: error.message })
        };
      }

      const response = await fetch(`${OPENROUTER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      if (!serverless) {
        return data;
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(data)
      };
    } else {
      const response = await openai.chat.completions.create({
        model: model || CHATGPT_MODEL,
        messages,
        temperature: isGPT5 ? 1 : 0.7,
        [isGPT5 ? 'max_completion_tokens' : 'max_tokens']: 1000
      });

      if (!serverless) {
        return response;
      }
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(response)
      };
    }
  } catch (error) {
    console.error(useOpenRouter ? 'OpenRouter API error:' : 'OpenAI API error:', error);
    if (!serverless) throw error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: `Failed to get response from ${useOpenRouter ? 'OpenRouter' : 'OpenAI'}`
      })
    };
  }
};

// Draw function that can be called from other modules
const draw = async (body, serverless = true) => {
  const headers = getResponseHeaders();
  
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OpenAI API key not configured');
    if (!serverless) throw error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid' } = body;
    
    if (!prompt) {
      const error = new Error('Prompt is required');
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate size parameter and determine model
    const validSizes = ['256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'];
    if (!validSizes.includes(size)) {
      const error = new Error(`Invalid size. Must be one of: ${validSizes.join(', ')}`);
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Determine model based on size
    const isDallE2Size = ['256x256', '512x512'].includes(size);
    const model = isDallE2Size ? 'dall-e-2' : 'dall-e-3';

    // DALL-E 2 doesn't support quality and style parameters
    if (isDallE2Size) {
      const response = await openai.images.generate({
        model,
        prompt,
        n: 1,
        size
      });
      const url = response.data[0].url;

      if (!serverless) {
        return url;
      }
      return {
        statusCode: 200,
        headers,
        body: url
      };
    }

    // DALL-E 3 validation and generation
    // Validate quality parameter
    const validQualities = ['standard', 'hd'];
    if (!validQualities.includes(quality)) {
      const error = new Error(`Invalid quality. Must be one of: ${validQualities.join(', ')}`);
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate style parameter
    const validStyles = ['vivid', 'natural'];
    if (!validStyles.includes(style)) {
      const error = new Error(`Invalid style. Must be one of: ${validStyles.join(', ')}`);
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    const response = await openai.images.generate({
      model,
      prompt,
      n: 1,
      size,
      quality,
      style
    });
    const url = response.data[0].url;

    if (!serverless) {
      return url;
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(url)
    };
  } catch (error) {
    console.error('OpenAI DALL-E API error:', error);
    if (!serverless) throw error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate image with DALL-E'
      })
    };
  }
};

// Video function that can be called from other modules
const video = async (body, serverless = true) => {
  const headers = getResponseHeaders();
  
  // For video generation, we need Azure OpenAI credentials
  if (!process.env.AZURE_OPENAI_ENDPOINT || !process.env.AZURE_OPENAI_API_KEY) {
    const error = new Error('Azure OpenAI endpoint and API key are required for video generation');
    if (!serverless) throw error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }

  // Using Azure OpenAI API directly with fetch, no SDK client needed

  try {
    const { prompt, duration = 5, resolution = '1280x720' } = body;
    
    if (!prompt) {
      const error = new Error('Prompt is required');
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate duration parameter (Sora typically supports 5-60 seconds)
    if (typeof duration !== 'number' || duration < 5 || duration > 60) {
      const error = new Error('Duration must be a number between 5 and 60 seconds');
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate resolution parameter
    const validResolutions = ['1280x720', '1920x1080', '720x1280', '1080x1920'];
    if (!validResolutions.includes(resolution)) {
      const error = new Error(`Invalid resolution. Must be one of: ${validResolutions.join(', ')}`);
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Use Azure OpenAI API for Sora video generation
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = '2024-12-01-preview'; // Latest API version for Sora
    const deploymentName = process.env.AZURE_OPENAI_SORA_DEPLOYMENT || 'sora';

    const response = await fetch(`${azureEndpoint}/openai/deployments/${deploymentName}/videos/generations?api-version=${apiVersion}`, {
      method: 'POST',
      headers: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        duration,
        resolution
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Azure OpenAI Sora API error: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!serverless) {
      return data;
    }
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('OpenAI Sora API error:', error);
    if (!serverless) throw error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate video with Sora'
      })
    };
  }
};

// TTS function that can be called from other modules
const tts = async (body, serverless = true) => {
  const headers = getResponseHeaders();
  
  if (!process.env.OPENAI_API_KEY) {
    const error = new Error('OpenAI API key not configured');
    if (!serverless) throw error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  try {
    const { input, voice = 'alloy', model = 'tts-1', response_format = 'mp3', speed = 1.0 } = body;
    
    if (!input) {
      const error = new Error('Input text is required');
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate voice parameter
    const validVoices = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'fable', 'nova', 'onyx', 'sage', 'shimmer'];
    if (!validVoices.includes(voice)) {
      const error = new Error(`Invalid voice. Must be one of: ${validVoices.join(', ')}`);
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate model parameter
    const validModels = ['tts-1', 'tts-1-hd'];
    if (!validModels.includes(model)) {
      const error = new Error(`Invalid model. Must be one of: ${validModels.join(', ')}`);
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate response format parameter
    const validFormats = ['mp3', 'opus', 'aac', 'flac'];
    if (!validFormats.includes(response_format)) {
      const error = new Error(`Invalid response format. Must be one of: ${validFormats.join(', ')}`);
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    // Validate speed parameter
    if (typeof speed !== 'number' || speed < 0.25 || speed > 4.0) {
      const error = new Error('Speed must be a number between 0.25 and 4.0');
      if (!serverless) throw error;
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }

    const response = await openai.audio.speech.create({
      model,
      voice,
      input,
      response_format,
      speed
    });

    // Convert response to buffer for both serverless and non-serverless
    const buffer = Buffer.from(await response.arrayBuffer());
    
    if (serverless) {
      const audioHeaders = {
        ...headers,
        'Content-Type': `audio/${response_format}`,
        'Content-Length': buffer.length.toString()
      };
      
      return {
        statusCode: 200,
        headers: audioHeaders,
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    } else {
      // For non-serverless (API handlers), return the buffer as base64 string
      return {
        body: buffer.toString('base64'),
        contentType: `audio/${response_format}`,
        size: buffer.length
      };
    }
  } catch (error) {
    console.error('OpenAI TTS API error:', error);
    if (!serverless) throw error;
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate speech with OpenAI TTS'
      })
    };
  }
};

// Main handler function
const handler = async (event, context) => {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: getResponseHeaders()
    };
  }

  // Set response headers
  const headers = getResponseHeaders();

  try {
    const { resource, id } = parsePathParams(event.path, 'openai');
    const useOpenRouter = event.queryStringParameters?.api === 'openrouter';

    // Initialize appropriate client based on API choice
    if (useOpenRouter) {
      if (!process.env.OPENROUTER_API_KEY) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'OpenRouter API key not configured' })
        };
      }
    } else {
      if (!process.env.OPENAI_API_KEY) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'OpenAI API key not configured' })
        };
      }
    }

    const openai = useOpenRouter ? null : new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Route handlers
    switch (`${event.httpMethod} /${resource}${id ? '/:id' : ''}`) {
      case 'POST /chat':
        const body = JSON.parse(event.body);
        return await chat(useOpenRouter ? 'openrouter' : 'openai', body, true);

      case 'POST /draw':
        // DALL-E 3 only works with OpenAI, not OpenRouter
        if (useOpenRouter) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Image generation is only available with OpenAI API, not OpenRouter' })
          };
        }
        const drawBody = JSON.parse(event.body);
        return await draw(drawBody, true);

      case 'POST /video':
        // Sora video generation only works with OpenAI, not OpenRouter
        if (useOpenRouter) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Video generation is only available with OpenAI API, not OpenRouter' })
          };
        }
        const videoBody = JSON.parse(event.body);
        return await video(videoBody, true);

      case 'POST /tts':
        // TTS only works with OpenAI, not OpenRouter
        if (useOpenRouter) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Text-to-speech is only available with OpenAI API, not OpenRouter' })
          };
        }
        const ttsBody = JSON.parse(event.body);
        return await tts(ttsBody, true);

      case 'GET /files':
        try {
          const filesList = await openai.files.list();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ files: filesList.data })
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to list OpenAI files' })
          };
        }

      case 'GET /vector_stores':
        try {
          const vectorStores = await openai.vectorStores.list();
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ vectorStores: vectorStores.data })
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to list vector stores' })
          };
        }

      case 'POST /vector_stores':
        try {
          const body = JSON.parse(event.body);
          const { name } = body;

          if (!name) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Name is required' })
            };
          }

          const vectorStore = await openai.vectorStores.create({
            name
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(vectorStore)
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: error.status || 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to create vector store' })
          };
        }

      case 'GET /vector_store_files/:id':
        try {
          if (!id) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Vector store ID is required' })
            };
          }

          const files = await openai.vectorStores.files.list(id);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ files: files.data })
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: error.status || 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to list vector store files' })
          };
        }

      case 'DELETE /vector_stores/:id':
        try {
          if (!id) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Vector store ID is required' })
            };
          }

          await openai.vectorStores.del(id);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ deleted: true, id })
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: error.status || 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to delete vector store' })
          };
        }

      case 'DELETE /files/:id':
        try {
          if (!id) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'File ID is required' })
            };
          }

          await openai.files.del(id);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ deleted: true, id })
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: error.status || 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to delete OpenAI file' })
          };
        }

      case 'POST /vector_store_files':
        try {
          const body = JSON.parse(event.body);
          const { vectorStoreId, fileId } = body;

          if (!vectorStoreId || !fileId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Vector store ID and file ID are required' })
            };
          }

          const file = await openai.vectorStores.files.create(vectorStoreId, {
            file_id: fileId
          });
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(file)
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: error.status || 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to add file to vector store' })
          };
        }

      case 'DELETE /vector_store_files':
        try {
          const body = JSON.parse(event.body);
          const { vectorStoreId, fileId } = body;

          if (!vectorStoreId || !fileId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Vector store ID and file ID are required' })
            };
          }

          // First delete the file from the vector store
          await openai.vectorStores.files.del(vectorStoreId, fileId);
          
          // Then delete the actual file
          await openai.files.del(fileId);
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ deleted: true, vectorStoreId, fileId })
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: error.status || 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to delete vector store file' })
          };
        }

      case 'POST /file_search':
        try {
          const body = JSON.parse(event.body);
          const { question, vectorStoreId } = body;

          if (!question || !vectorStoreId) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Question and vector store ID are required' })
            };
          }

          const response = await openai.responses.create({
            model: CHATGPT_MODEL,
            input: question,
            tools: [{
              type: 'file_search',
              vector_store_ids: [vectorStoreId],
            }]
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: error.status || 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to search files' })
          };
        }

      case 'POST /files':
        try {
          const contentType = event.headers['content-type'] || event.headers['Content-Type'];
          if (!contentType || !contentType.includes('multipart/form-data')) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Content-Type must be multipart/form-data' })
            };
          }

          const boundary = contentType.split('boundary=')[1];
          if (!boundary) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Missing boundary in Content-Type' })
            };
          }

          // Parse form data
          const formData = parse(Buffer.from(event.body, 'base64'), boundary);
          const fileField = formData.find(field => field.name === 'file');
          
          if (!fileField || !fileField.data) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'File is required in form data' })
            };
          }

          // Check file size (max 100MB)
          const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
          if (fileField.data.length > MAX_FILE_SIZE) {
            return {
              statusCode: 413,
              headers,
              body: JSON.stringify({ error: 'File size exceeds the maximum limit of 100MB' })
            };
          }

          let tempFilePath = null;
          try {
            // Create temp directory if it doesn't exist
            const tmpDir = path.join('/tmp', 'openai-uploads');
            if (!fs.existsSync(tmpDir)) {
              fs.mkdirSync(tmpDir, { recursive: true });
            }

            // Save file to temp location
            tempFilePath = path.join(tmpDir, `upload-${Date.now()}-${fileField.filename || 'file'}`);
            fs.writeFileSync(tempFilePath, fileField.data);

            // Convert to OpenAI file format with filename
            const openaiFile = await toFile(tempFilePath, fileField.filename || 'uploaded-file');
            
            // Upload to OpenAI
            const file = await openai.files.create({
              file: openaiFile,
              purpose: 'assistants'
            });

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(file)
            };
          } finally {
            // Clean up temp file
            if (tempFilePath && fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
          }
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to upload file to OpenAI' })
          };
        }

        default:
          return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Not found' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

module.exports = { handler, chat, draw, video, tts };