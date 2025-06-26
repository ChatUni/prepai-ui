import { observer } from 'mobx-react-lite';
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import clientStore from '../../../stores/clientStore';
import ImageUpload from '../../ui/ImageUpload';
import BackButton from '../../ui/BackButton';
import Dialog from '../../ui/Dialog';
import { t } from '../../../stores/languageStore';
import { FiTrash2, FiPlus } from 'react-icons/fi';

const EditBannerPage = observer(() => {
  const navigate = useNavigate();

  useEffect(() => {
    clientStore.startEditing();
  }, []);

  const handleImageSelect = (file, index) => {
    clientStore.handleImageSelect(file, index);
  };

  const handleDelete = (index) => {
    clientStore.deleteBanner(index);
  };

  const handleAdd = () => {
    clientStore.addBanner();
  };

  const handleSave = async () => {
    if (clientStore.hasEmptyBanners) {
      clientStore.error = t('series.banners.emptyBannersError');
      clientStore.showErrorDialog();
      return;
    }
    await clientStore.saveChanges();
    if (!clientStore.error) {
      navigate(-1);
    } else {
      clientStore.showErrorDialog();
    }
  };

  const handleCancel = useCallback(() => {
    if (clientStore.hasUnsavedChanges) {
      clientStore.showConfirmDialog();
    } else {
      clientStore.cancelEditing();
      navigate(-1);
    }
  }, [navigate]);

  const handleConfirmCancel = () => {
    clientStore.hideConfirmDialog();
    clientStore.cancelEditing();
    navigate(-1);
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">{t('series.banners.title')}</h1>
        </div>
      </div>

      <div className="grid gap-8">
        {clientStore.client.settings.banners.map((banner, index) => (
          <div key={index}>
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{`${t('series.banners.banner')} ${index + 1}`}</h2>
              <button
                onClick={() => handleDelete(index)}
                className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-100 transition-colors"
                title={t('series.banners.delete')}
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
        {t('series.banners.add')}
      </button>

      <div className="flex justify-end gap-4 mt-8">
        <button
          onClick={handleCancel}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {t('common.cancel')}
        </button>
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={clientStore.loading || !clientStore.hasUnsavedChanges}
        >
          {t('common.save')}
        </button>
      </div>

      <Dialog
        isOpen={clientStore.isErrorDialogOpen}
        onClose={() => clientStore.hideErrorDialog()}
        title={t('common.error')}
      >
        <div className="text-red-600">{clientStore.formattedError}</div>
      </Dialog>

      <Dialog
        isOpen={clientStore.isConfirmDialogOpen}
        onClose={() => clientStore.hideConfirmDialog()}
        onConfirm={handleConfirmCancel}
        title={t('common.confirm')}
        isConfirm={true}
      >
        <div>{t('series.banners.confirmCancel')}</div>
      </Dialog>
    </div>
  );
});

export default EditBannerPage;