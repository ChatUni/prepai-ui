import { observer } from 'mobx-react-lite';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import ImageUpload from '../../ui/ImageUpload';

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

  const handleFileChange = (file) => {
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
          <ImageUpload
            id="icon"
            label={t('assistants.edit.icon')}
            previewUrl={assistantsStore.selectedImagePreview || assistantsStore.currentAssistant.iconUrl}
            onImageSelect={handleFileChange}
            buttonText={assistantsStore.currentAssistant.iconUrl ? t('assistants.edit.changeImage') : t('assistants.edit.selectImage')}
            imageStyle="round"
          />

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