import { handleUrlSigning, handleFileUpload } from './utils/cosServerHelper';
import { makeApi } from './utils/http';

export const handler = makeApi({
  handlers: {
    post: {
      sign: (q, b) => handleUrlSigning(b.url),
      upload: (q, b) => handleFileUpload(b.file, b.key),
    },
  },
  nocache: true,
})
