import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clientStore from '../../../stores/clientStore';
import ImageUpload from '../../ui/ImageUpload';
import BackButton from '../../ui/BackButton';
import lang from '../../../stores/languageStore';
import { FiSave } from 'react-icons/fi';

const EditBannerPage = observer(() => {
  const navigate = useNavigate();

  useEffect(() => {
    if (!clientStore.client.settings.banners.length) {
      clientStore.loadClient();
    }
  }, []);

  const handleImageSelect = async (file, index) => {
    try {
      clientStore.setPreviewUrl(index, file);
      await clientStore.uploadBanner(file, index);
    } catch (error) {
      console.error('Failed to upload banner:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{lang.t('series.banners.title')}</h1>
        </div>
      </div>

      <div className="grid gap-8">
        {[0, 1, 2].map((index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <ImageUpload
              id={`banner-${index + 1}`}
              label={`${lang.t('series.banners.banner')} ${index + 1}`}
              previewUrl={clientStore.previewUrls[index] || clientStore.client.settings.banners[index]}
              onImageSelect={(file) => handleImageSelect(file, index)}
              className="w-full"
            />
          </div>
        ))}
      </div>

      {clientStore.error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {clientStore.error}
        </div>
      )}
    </div>
  );
});

export default EditBannerPage;