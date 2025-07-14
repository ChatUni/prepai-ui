import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { t } from '../../stores/languageStore';

const getYouTubeEmbedUrl = (url) => {
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  return match ? `https://www.youtube.com/embed/${match[1]}` : url;
};

const getMediaStyle = (style, type) => {
  if (type === 'video') {
    return 'w-full aspect-video rounded-lg shadow-lg';
  }

  switch (style) {
    case 'round':
      return 'w-24 h-24 object-cover rounded-full';
    case 'rectangular':
    default:
      return 'max-w-full h-auto rounded-lg shadow-lg';
  }
};

const isImageFile = (file) => {
  if (!file) return false;
  return file.type?.startsWith('image/') || false;
};

const isVideoFile = (file) => {
  if (!file) return false;
  return file.type?.startsWith('video/') || false;
};

const isDocumentFile = (file) => {
  if (!file) return false;
  const docTypes = [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  return docTypes.includes(file.type) || file.name?.match(/\.(doc|docx)$/i);
};

const getFileIcon = () => (
  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const getImage = (store, field = 'image', index = -1) => {
  if (!store || (!store.editingItem && !store.item)) return '';
  const t = (store.editingItem || store.item)[field];
  return index === -1 ? t : t[index];
}

const ImageUpload = observer(({
  id,
  store,
  field,
  index,
  previewUrl,
  buttonText,
  className = '',
  imageStyle = 'rectangular',
  selectedFile,
  onImageSelect,
  hasTitle = true,
  type = 'image',
  label,
  onMediaSelect,
  mediaStyle = 'rectangular',
  required = false
}) => {
  if (!id) id = `${store.name}-${field}`;
  
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  
  // Get the current file from store if not provided as prop
  const currentFile = selectedFile || getImage(store, field, index);
  
  // Create preview URL when file changes
  useEffect(() => {
    if (currentFile instanceof File && (isImageFile(currentFile) || isVideoFile(currentFile))) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviewUrl(reader.result);
      };
      reader.readAsDataURL(currentFile);
    } else {
      setFilePreviewUrl('');
    }
  }, [currentFile]);
  
  const getDefaultButtonText = () => {
    if (currentFile || previewUrl) {
      if (isImageFile(currentFile)) {
        return t('series.edit.changeImage');
      } else if (isVideoFile(currentFile)) {
        return t('course.add.changeVideo');
      } else {
        return t('series.edit.changeFile');
      }
    }
    
    if (type === 'video') {
      return t('course.add.selectVideo');
    } else if (type === 'image') {
      return t('series.edit.selectImage');
    }
    
    return t('series.edit.selectFile');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (onMediaSelect) {
        onMediaSelect({
          file,
          isFile: true,
          preview: URL.createObjectURL(file)
        });
      } else if (onImageSelect) {
        onImageSelect(file);
      } else {
        store.setEditingField(field, file, index);
      }
    }
  };

  const finalButtonText = buttonText || getDefaultButtonText();
  const displayPreviewUrl = filePreviewUrl || previewUrl || getImage(store, field, index);
  const finalMediaStyle = mediaStyle || imageStyle;

  const getAcceptAttribute = () => {
    if (type === 'video') {
      return 'video/*';
    } else if (type === 'image') {
      return 'image/*';
    } else {
      return 'image/*,video/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  };

  const renderIcon = () => {
    if (currentFile && isDocumentFile(currentFile)) {
      return null;
    } else if (type === 'video') {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
  };

  const renderPreview = () => {
    if (currentFile && isDocumentFile(currentFile)) {
      return (
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          {getFileIcon()}
          <div>
            <p className="text-sm font-medium text-gray-900">{currentFile.name}</p>
            <p className="text-xs text-gray-500">
              {(currentFile.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      );
    } else if (currentFile && isVideoFile(currentFile)) {
      return (
        <video
          src={filePreviewUrl}
          controls
          className={getMediaStyle(finalMediaStyle, 'video')}
        >
          Your browser does not support the video tag.
        </video>
      );
    } else if (displayPreviewUrl && type === 'video' && !isVideoFile(currentFile)) {
      // Handle YouTube embed or other video URLs
      return (
        <iframe
          src={getYouTubeEmbedUrl(displayPreviewUrl)}
          className={getMediaStyle(finalMediaStyle, 'video')}
          allowFullScreen
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      );
    } else if (displayPreviewUrl) {
      return (
        <img
          src={displayPreviewUrl}
          alt={finalButtonText}
          className={getMediaStyle(finalMediaStyle, 'image')}
        />
      );
    }
    return null;
  };

  return (
    <div className={className}>
      {hasTitle && (
        <label className="block text-sm font-medium mb-1">
          {label || (store ? t(`${store.name}.${field}`) : '')}
        </label>
      )}
      <div className="relative">
        <input
          type="file"
          id={id}
          name={id}
          accept={getAcceptAttribute()}
          onChange={handleImageSelect}
          className="hidden"
          required={required}
        />
        <label
          htmlFor={id}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
        >
          {renderIcon()}
          <span className="text-gray-600">
            {finalButtonText}
          </span>
        </label>
      </div>
      {(displayPreviewUrl || currentFile) && (
        <div className="mt-2">
          {renderPreview()}
        </div>
      )}
    </div>
  );
});

export default ImageUpload;