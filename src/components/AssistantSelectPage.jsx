import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';
import assistantsStore from '../stores/assistantsStore';
import languageStore from '../stores/languageStore';
import SearchBar from './ui/SearchBar';

const AssistantSelectPage = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = languageStore;

  // Get mode from URL params
  const mode = searchParams.get('mode') || 'edit';

  useEffect(() => {
    // Load assistants data if not already loaded
    if (assistantsStore.assistants.length === 0) {
      assistantsStore.fetchAssistants();
    }
  }, []);

  const handleAssistantClick = (assistant) => {
    navigate(`/assistants/${assistant.id}/edit`);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        {t('menu.admin_page.edit_assistant')}
      </h1>
      <div className="mb-8 flex-shrink-0">
        <SearchBar />
      </div>
      <div className="bg-white rounded-lg shadow flex-1 overflow-hidden">
        <div className="divide-y divide-gray-200 overflow-y-auto h-full">
          {assistantsStore.loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">{t('common.loading')}</div>
            </div>
          ) : assistantsStore.assistants.map(assistant => (
            <div
              key={assistant.id}
              onClick={() => handleAssistantClick(assistant)}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{assistant.name}</h3>
                  {assistant.greeting && (
                    <p className="text-sm text-gray-500">
                      {assistant.greeting}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!assistantsStore.loading && assistantsStore.assistants.length === 0 && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">{t('common.no_results')}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AssistantSelectPage;