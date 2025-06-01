import { handleUrlSigning, handleFileUpload } from './cosServerHelper';

export default {
  handlers: {
    post: {
      sign: (q, b) => handleUrlSigning(b.url),
      upload: (q, b) => handleFileUpload(b.file, b.key),
    },
  },
  nocache: true,
}
