import { observer } from 'mobx-react-lite';
import lang from '../../stores/languageStore';

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
      return 'w-full h-auto rounded-lg shadow-lg';
  }
};

const MediaUpload = observer(({
  id,
  label,
  previewUrl,
  onMediaSelect,
  type = 'image',
  buttonText,
  className = '',
  mediaStyle = 'rectangular',
  required = false
}) => {
  const defaultButtonText = type === 'image' 
    ? (previewUrl ? lang.t('series.edit.changeImage') : lang.t('series.edit.selectImage'))
    : (previewUrl ? lang.t('course.add.changeVideo') : lang.t('course.add.selectVideo'));

  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          type="file"
          id={id}
          name={id}
          accept={type === 'image' ? 'image/*' : 'video/*'}
          onChange={(e) => {
            const file = e.target.files[0];
            onMediaSelect(file);
          }}
          className="hidden"
          required={required}
        />
        <label
          htmlFor={id}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
        >
          {type === 'image' ? (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
          <span className="text-gray-600">
            {buttonText || defaultButtonText}
          </span>
        </label>
      </div>
      {previewUrl && (
        <div className="mt-2">
          {type === 'image' ? (
            <img
              src={previewUrl instanceof File ? URL.createObjectURL(previewUrl) : previewUrl}
              alt={buttonText || defaultButtonText}
              className={getMediaStyle(mediaStyle, type)}
            />
          ) : (
            previewUrl instanceof File ? (
              <video
                src={URL.createObjectURL(previewUrl)}
                controls
                className={getMediaStyle(mediaStyle, type)}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <iframe
                src={getYouTubeEmbedUrl(previewUrl)}
                className={getMediaStyle(mediaStyle, type)}
                allowFullScreen
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )
          )}
        </div>
      )}
    </div>
  );
});

export default MediaUpload;