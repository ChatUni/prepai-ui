import { observer } from 'mobx-react-lite';
import { useState, useEffect } from 'react';
import { t } from '../../stores/languageStore';

const getImageStyle = (style) => {
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
  hasTitle = true
}) => {
  if (!id) id = `${store.name}-${field}`;
  
  const [filePreviewUrl, setFilePreviewUrl] = useState('');
  
  // Get the current file from store if not provided as prop
  const currentFile = selectedFile || getImage(store, field, index);
  
  // Create preview URL when file changes
  useEffect(() => {
    if (currentFile instanceof File && isImageFile(currentFile)) {
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
      return isImageFile(currentFile) ? t('series.edit.changeImage') : t('series.edit.changeFile');
    }
    return t('series.edit.selectFile');
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (onImageSelect) {
      onImageSelect(file);
    } else {
      store.setEditingField(field, file, index);
    }
  };

  const finalButtonText = buttonText || getDefaultButtonText();
  const displayPreviewUrl = filePreviewUrl || previewUrl || getImage(store, field, index);

  return (
    <div className={className}>
      {hasTitle && (
        <label className="block text-sm font-medium mb-1">
          {store ? t(`${store.name}.${field}`) : ''}
        </label>
      )}
      <div className="relative">
        <input
          type="file"
          id={id}
          name={id}
          accept="image/*,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleImageSelect}
          className="hidden"
        />
        <label
          htmlFor={id}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
        >
          {currentFile && isDocumentFile(currentFile) ? (
            null //getFileIcon()
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-gray-600">
            {finalButtonText}
          </span>
        </label>
      </div>
      {(displayPreviewUrl || currentFile) && (
        <div className="mt-2">
          {currentFile && isDocumentFile(currentFile) ? (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
              {getFileIcon()}
              <div>
                <p className="text-sm font-medium text-gray-900">{currentFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(currentFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          ) : displayPreviewUrl && (
            <img
              src={displayPreviewUrl}
              alt={finalButtonText}
              className={getImageStyle(imageStyle)}
            />
          )}
        </div>
      )}
    </div>
  );
});

export default ImageUpload;