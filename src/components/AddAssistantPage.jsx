import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import assistantsStore from '../stores/assistantsStore';
import languageStore from '../stores/languageStore';

const AddAssistantPage = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await assistantsStore.createAssistant();
      navigate('/assistants');
    } catch (error) {
      // Error is already handled in store
      console.error('Failed to create assistant:', error);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          throw new Error(t('assistant.add.uploadError'));
        }
        
        const { url } = await response.json();
        assistantsStore.setNewAssistantField('iconUrl', url);
      } catch (error) {
        console.error('Failed to upload file:', error);
      }
    }
  };

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">{t('assistant.add.title')}</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistant.add.name')}
            </label>
            <input
              id="name"
              type="text"
              value={assistantsStore.newAssistant.name}
              onChange={(e) => assistantsStore.setNewAssistantField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Greeting Input */}
          <div>
            <label htmlFor="greeting" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistant.add.greeting')}
            </label>
            <input
              id="greeting"
              type="text"
              value={assistantsStore.newAssistant.greeting}
              onChange={(e) => assistantsStore.setNewAssistantField('greeting', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Prompt Input */}
          <div>
            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistant.add.prompt')}
            </label>
            <textarea
              id="prompt"
              value={assistantsStore.newAssistant.prompt}
              onChange={(e) => assistantsStore.setNewAssistantField('prompt', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              required
            />
          </div>

          {/* Icon Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('assistant.add.icon')}
            </label>
            <div className="relative">
              <input
                type="file"
                id="icon"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <label
                htmlFor="icon"
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-gray-600">
                  {assistantsStore.newAssistant.iconUrl ? t('assistant.add.changeImage') : t('assistant.add.selectImage')}
                </span>
              </label>
              {assistantsStore.newAssistant.iconUrl && (
                <div className="mt-2 text-sm text-gray-500">
                  {t('assistant.add.fileSelected')}
                </div>
              )}
            </div>
            {assistantsStore.newAssistant.iconUrl && (
              <div className="mt-2">
                <img
                  src={assistantsStore.newAssistant.iconUrl}
                  alt={t('assistant.add.iconPreview')}
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
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/assistants')}
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
              {assistantsStore.loading ? t('assistant.add.creating') : t('assistant.add.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

export default AddAssistantPage;