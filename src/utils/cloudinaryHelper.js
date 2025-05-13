import clientStore from "../stores/clientStore";

/**
 * Helper function for uploading files to Cloudinary
 * @param {File} file - The file to upload
 * @param {string} folder - The Cloudinary folder path to upload to
 * @returns {Promise<string>} The URL of the uploaded file
 */
export const uploadToCloudinary = async (file, folder) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', `${clientStore.client.id}/${folder}`);

  const response = await fetch(`/api/cloudinary_upload`, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }

  const data = await response.json();
  return data.url;
};

/**
 * Helper function for deleting files from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId) => {
  const response = await fetch(`/api/cloudinary_delete`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ public_id: publicId })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Cloudinary deletion failed: ${error.message}`);
  }
};