import { observer } from 'mobx-react-lite';
import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';

const AssistantsPage = observer(() => {
  const navigate = useNavigate();
  const { t } = languageStore;
  
  // Handle image loading errors - defined outside render function to prevent rerenders
  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = '/images/avatar.png'; // Corrected fallback image path
  }, []);

  const mainContent = (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('menu.ai')}</h1>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assistantsStore.assistants.map(assistant => (
          <div
            key={assistant.id}
            className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105 cursor-pointer"
            onClick={() => navigate(`/assistants/${assistant.id}/chat`)}
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden mb-4">
                <img
                  src={assistant.image || '/images/avatar.png'}
                  alt={assistant.name}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                />
              </div>
              <h2 className="text-xl font-semibold text-center">{assistant.name}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const errorContent = (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <div className="text-gray-600 mt-2">{assistantsStore.error}</div>
    </div>
  );

  return (
    <LoadingState
      isLoading={assistantsStore.loading}
      isError={!!assistantsStore.error}
      isEmpty={!assistantsStore.loading && !assistantsStore.error && !assistantsStore.assistants.length}
      customMessage={
        assistantsStore.loading ? t('menu.categories.assistant.loading') :
        assistantsStore.error ? t('menu.categories.assistant.loadingFailed') :
        !assistantsStore.assistants.length ? t('menu.categories.assistant.notFound') :
        null
      }
    >
      {assistantsStore.error ? errorContent : mainContent}
    </LoadingState>
  );
});

export default AssistantsPage;