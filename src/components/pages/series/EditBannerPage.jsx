import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import clientStore from '../../../stores/clientStore';
import ImageUpload from '../../ui/ImageUpload';
import BackButton from '../../ui/BackButton';
import lang from '../../../stores/languageStore';
import { FiTrash2, FiPlus } from 'react-icons/fi';

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

  const handleDelete = async (index) => {
    try {
      await clientStore.deleteBanner(index);
    } catch (error) {
      console.error('Failed to delete banner:', error);
    }
  };

  const handleAdd = async () => {
    try {
      await clientStore.addBanner();
    } catch (error) {
      console.error('Failed to add banner:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{lang.t('series.banners.title')}</h1>
        </div>
      </div>

      <div className="grid gap-8">
        {clientStore.client.settings.banners.map((banner, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold">{`${lang.t('series.banners.banner')} ${index + 1}`}</h2>
              <button
                onClick={() => handleDelete(index)}
                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors"
                title={lang.t('series.banners.delete')}
              >
                <FiTrash2 size={20} />
              </button>
            </div>
            <ImageUpload
              id={`banner-${index + 1}`}
              previewUrl={clientStore.previewUrls[index] || banner}
              onImageSelect={(file) => handleImageSelect(file, index)}
              className="w-full"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleAdd}
        className="mt-4 flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <FiPlus size={20} />
        {lang.t('series.banners.add')}
      </button>

      {clientStore.error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {clientStore.error}
        </div>
      )}
    </div>
  );
});

export default EditBannerPage;