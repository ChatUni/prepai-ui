import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';
import AssistantCard from './AssistantCard';
import { AccordionSection } from '../../ui/AdminAccordion';

const AssistantsPage = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = languageStore;
  
  // Check if we're in edit mode
  const isEditMode = searchParams.get('mode') === 'edit';
  
  // State for expanded groups
  const [expandedGroups, setExpandedGroups] = React.useState(new Set());
  
  const handleAssistantClick = (assistant) => {
    if (isEditMode) {
      navigate(`/assistants/${assistant.id}/edit`);
    } else {
      navigate(`/assistants/${assistant.id}/chat`);
    }
  };

  const handleToggleVisibility = async (assistant) => {
    try {
      await assistantsStore.toggleAssistantVisibility(assistant);
    } catch (error) {
      console.error('Failed to toggle assistant visibility:', error);
    }
  };

  const handleEdit = (assistant) => {
    navigate(`/assistants/${assistant.id}/edit`);
  };

  const handleDelete = async (assistant) => {
    if (window.confirm(t('assistants.confirmDelete', { name: assistant.name }))) {
      try {
        await assistantsStore.deleteAssistant(assistant);
      } catch (error) {
        console.error('Failed to delete assistant:', error);
      }
    }
  };

  const toggleGroup = (group) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const GroupSection = ({ group, assistants }) => (
    <AccordionSection
      key={group}
      title={`${group} (${assistants.length})`}
      isExpanded={expandedGroups.has(group)}
      onToggle={() => toggleGroup(group)}
      maxHeight="96"
      isDraggable={false}
    >
      <div className="space-y-3 p-2">
        {assistants.map(assistant => (
          <AssistantCard
            key={assistant.id}
            assistant={assistant}
            onClick={handleAssistantClick}
            isEditMode={isEditMode}
            onToggleVisibility={handleToggleVisibility}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </AccordionSection>
  );

  const mainContent = (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? t('menu.admin_page.manage_assistant') : t('menu.ai')}
        </h1>
        {isEditMode && (
          <button
            onClick={() => navigate('/assistants/add')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('assistants.add.title')}
          </button>
        )}
      </div>
      <div className="w-full space-y-4">
        {Object.entries(assistantsStore.groupedAssistants).map(([group, assistants]) => (
          <GroupSection
            key={group}
            group={group}
            assistants={assistants}
          />
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