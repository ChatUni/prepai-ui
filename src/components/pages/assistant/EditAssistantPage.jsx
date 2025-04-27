import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';

const EditAssistantPage = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    assistantsStore.setAssistant(id);
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    // Only append the icon file if one was selected
    const iconInput = e.target.querySelector('input[type="file"]');
    if (iconInput && iconInput.files[0]) {
      formData.append('icon', iconInput.files[0]);
    }
    
    try {
      await assistantsStore.saveAssistant(formData);
      navigate('/assistants');
    } catch (error) {
      // Error is already handled in store
      console.error('Failed to save assistant:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    assistantsStore.setSelectedImagePreview(file);
  };

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {assistantsStore.isEditMode ? t('assistants.edit.title') : t('assistants.add.title')}
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistants.edit.name')}
            </label>
            <input
              id="name"
              type="text"
              value={assistantsStore.currentAssistant.name}
              onChange={(e) => assistantsStore.setAssistantField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Greeting Input */}
          <div>
            <label htmlFor="greeting" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistants.edit.greeting')}
            </label>
            <textarea
              id="greeting"
              rows={5}
              value={assistantsStore.currentAssistant.greeting}
              onChange={(e) => assistantsStore.setAssistantField('greeting', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistants.edit.prompt')}
            </label>
            <textarea
              id="prompt"
              rows={15}
              value={assistantsStore.currentAssistant.prompt}
              onChange={(e) => assistantsStore.setAssistantField('prompt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              required
            />
          </div>

          {/* Model Selection */}
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistants.edit.model')}
            </label>
            <select
              id="model"
              name="model"
              value={assistantsStore.currentAssistant.model}
              onChange={(e) => assistantsStore.setAssistantField('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">{t('assistants.edit.selectModel')}</option>
              {assistantsStore.models.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Icon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistants.edit.icon')}
            </label>
            <div className="relative">
              <input
                type="file"
                id="icon"
                name="icon"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="icon"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">
                  {assistantsStore.currentAssistant.iconUrl ? t('assistants.edit.changeImage') : t('assistants.edit.selectImage')}
                </span>
              </label>
              {assistantsStore.currentAssistant.iconUrl && (
                <div className="mt-2 text-sm text-gray-500">
                  {t('assistants.edit.fileSelected')}
                </div>
              )}
            </div>
            {(assistantsStore.selectedImagePreview || assistantsStore.currentAssistant.iconUrl) && (
              <div className="mt-2">
                <img
                  src={assistantsStore.selectedImagePreview || assistantsStore.currentAssistant.iconUrl}
                  alt={t('assistants.edit.iconPreview')}
                  className="w-24 h-24 object-cover rounded-full"
                />
              </div>
            )}
          </div>

          {/* Error message */}
          {assistantsStore.error && (
            <div className="text-red-600 text-sm">{assistantsStore.error}</div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 mb-10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={assistantsStore.loading}
              className={`px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                assistantsStore.loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {assistantsStore.loading 
                ? (assistantsStore.isEditMode ? t('assistants.edit.saving') : t('assistants.add.creating'))
                : (assistantsStore.isEditMode ? t('assistants.edit.save') : t('assistants.add.create'))
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default EditAssistantPage;