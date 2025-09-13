import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Blob } from 'buffer';
import { FormData } from '@web-std/form-data';
import { File } from '@web-std/file';
import { getResponseHeaders } from './utils/http.js';
import { get, save, remove, flat, maxId } from './utils/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handler = async (event, context) => {
  // Handle OPTIONS requests for CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: getResponseHeaders()
    };
  }

  const headers = getResponseHeaders();

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const id = event.path.split('/').pop();
  if (!id) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Series ID is required' })
    };
  }

  try {

    // 1. Get series details with instructor
    const allSeries = await flat('series', `m_id=${id}`);
    const series = allSeries?.[0];

    if (!series) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Series not found' })
      };
    }

    // Delete existing vector store if it exists
    if (series.vector_store_id) {
      const deleteResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/vector_stores/${series.vector_store_id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!deleteResponse.ok) {
        console.error('Failed to delete existing vector store');
      }
    }

    // 2. Get all courses for this series
    const coursesRows = await flat('courses', `m_series_id=${id}`);

    // 3. Create vector store
    const vectorStoreName = `${series.instructor?.name} - ${series.name}`;
    const vectorStoreResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/vector_stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: vectorStoreName })
    });

    if (!vectorStoreResponse.ok) {
      throw new Error('Failed to create vector store');
    }

    const vectorStore = await vectorStoreResponse.json();

    // 4. Save vector store ID to series table
    series.vector_store_id = vectorStore.id;
    await save('series', series);

    // 5. Process each course transcript
    for (const course of coursesRows) {
      if (!course.transcript) continue;

      // Create temp file
      const tmpDir = '/tmp/transcripts';
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }

      const tempFilePath = path.join(tmpDir, `prepai-transcript-${course.id}.txt`);
      fs.writeFileSync(tempFilePath, course.transcript);

      // Read file content and create form data
      const fileContent = fs.readFileSync(tempFilePath);
      const uploadFile = new File([fileContent], path.basename(tempFilePath), { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', uploadFile);

      // Upload file
      const fileResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/files`, {
        method: 'POST',
        body: formData
      });

      if (!fileResponse.ok) {
        console.error(`Failed to upload transcript for course ${course.id}`);
        continue;
      }

      const uploadedFile = await fileResponse.json();

      // Add file to vector store
      const addFileResponse = await fetch(`${event.rawUrl.split('/vector-store/')[0]}/openai/vector_store_files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vectorStoreId: vectorStore.id,
          fileId: uploadedFile.id
        })
      });

      if (!addFileResponse.ok) {
        console.error(`Failed to add file to vector store for course ${course.id}`);
      }

      // Clean up temp file
      fs.unlinkSync(tempFilePath);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Vector store created successfully',
        vectorStoreId: vectorStore.id
      })
    };
  } catch (error) {
    console.error('Error creating vector store:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to create vector store' })
    };
  }
};

export { handler };