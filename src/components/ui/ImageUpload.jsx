import { observer } from 'mobx-react-lite';
import lang from '../../stores/languageStore';

const getImageStyle = (style) => {
  switch (style) {
    case 'round':
      return 'w-24 h-24 object-cover rounded-full';
    case 'rectangular':
    default:
      return 'max-w-full h-auto rounded-lg shadow-lg';
  }
};

const ImageUpload = observer(({
  id,
  label,
  previewUrl,
  onImageSelect,
  buttonText = previewUrl ? lang.t('series.edit.changeImage') : lang.t('series.edit.selectImage'),
  className = '',
  imageStyle = 'rectangular'
}) => (
  <div className={className}>
    <label className="block text-sm font-medium mb-1">
      {label}
    </label>
    <div className="relative">
      <input
        type="file"
        id={id}
        name={id}
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files[0];
          onImageSelect(file);
        }}
        className="hidden"
      />
      <label
        htmlFor={id}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-gray-600">
          {buttonText}
        </span>
      </label>
    </div>
    {previewUrl && (
      <div className="mt-2">
        <img
          src={previewUrl}
          alt={buttonText}
          className={getImageStyle(imageStyle)}
        />
      </div>
    )}
  </div>
));

export default ImageUpload;