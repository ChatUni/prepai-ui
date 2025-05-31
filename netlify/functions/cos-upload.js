import { verifyHttpMethod } from './utils/http';
import { handleFileUpload } from './utils/cosServerHelper';

export const handler = async (event) => {
  const methodError = verifyHttpMethod(event, 'POST');
  if (methodError) return methodError;

  const { file, key } = JSON.parse(event.body);
  return handleFileUpload(file, key);
};