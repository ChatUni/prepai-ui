import { verifyHttpMethod } from './utils/http';
import { handleUrlSigning } from './utils/cosServerHelper';

export const handler = async (event) => {
  const methodError = verifyHttpMethod(event, 'POST');
  if (methodError) return methodError;

  const { url } = JSON.parse(event.body);
  return handleUrlSigning(url);
};