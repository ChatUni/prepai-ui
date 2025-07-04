const OpenAI = require('openai');
const { parsePathParams } = require('./utils/pathUtils.js');
const { parse } = require('multipart-formdata');
const { headers: getResponseHeaders } = require('./utils/http.js');
const fs = require('fs');
const path = require('path');
const { toFile } = require('openai');

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1';
const CHATGPT_MODEL = 'gpt-4o-mini';

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

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    // Route handlers
    switch (`${event.httpMethod} /${resource}${id ? '/:id' : ''}`) {
      case 'POST /chat':
        try {
          const body = JSON.parse(event.body);
          const { messages, model } = body;
          
          if (!messages || !Array.isArray(messages)) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Messages array is required' })
            };
          }

          if (useOpenRouter) {
            if (!model) {
              return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Model is required for OpenRouter' })
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
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(data)
            };
          } else {
            const response = await openai.chat.completions.create({
              model: model || CHATGPT_MODEL,
              messages,
              temperature: 0.7,
              max_tokens: 1000
            });

            return {
              statusCode: 200,
              headers,
              body: JSON.stringify(response)
            };
          }
        } catch (error) {
          console.error(useOpenRouter ? 'OpenRouter API error:' : 'OpenAI API error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
              error: `Failed to get response from ${useOpenRouter ? 'OpenRouter' : 'OpenAI'}`
            })
          };
        }

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

module.exports = { handler };