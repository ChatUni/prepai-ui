import OpenAI from 'openai';
import { parsePathParams } from './utils/pathUtils.js';
import { parse } from 'multipart-formdata';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { toFile } from 'openai';

// Main handler function
export const handler = async (event, context) => {
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'OpenAI API key not configured' })
      };
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const { resource, id } = parsePathParams(event.path, 'openai');

    // Route handlers
    switch (`${event.httpMethod} /${resource}${id ? '/:id' : ''}`) {
      case 'POST /chat':
        try {
          const body = JSON.parse(event.body);
          const messages = body.messages;
          if (!messages || !Array.isArray(messages)) {
            return {
              statusCode: 400,
              headers,
              body: JSON.stringify({ error: 'Messages array is required' })
            };
          }

          const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages,
            temperature: 0.7,
            max_tokens: 1000
          });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(response)
          };
        } catch (error) {
          console.error('OpenAI API error:', error);
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to get response from OpenAI' })
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