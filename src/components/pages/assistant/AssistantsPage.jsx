import React from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import LoadingState from '../../ui/LoadingState';
import AssistantCard from './AssistantCard';
import { AccordionSection } from '../../ui/AdminAccordion';

const GroupSection = observer(({ group, assistants, index, navigate }) => (
  <AccordionSection
    key={group}
    title={`${group} (${assistants.length})`}
    isExpanded={assistantsStore.isGroupExpanded(group)}
    onToggle={() => assistantsStore.toggleGroup(group)}
    maxHeight="96"
    index={index}
    moveGroup={assistantsStore.moveGroup}
    onDrop={() => assistantsStore.saveGroupOrder()}
    isDraggable={assistantsStore.isEditMode}
  >
    <div className="space-y-3 p-2">
      {assistants.map(assistant => (
        <AssistantCard
          key={assistant.id}
          assistant={assistant}
          onClick={(assistant) => assistantsStore.handleAssistantClick(assistant, navigate)}
          isEditMode={assistantsStore.isEditMode}
          onToggleVisibility={assistantsStore.handleToggleVisibility}
          onEdit={(assistant) => assistantsStore.handleEdit(assistant, navigate)}
          onDelete={assistantsStore.handleDelete}
        />
      ))}
    </div>
  </AccordionSection>
));

const AssistantsPage = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();

  const mainContent = (
    <div className="flex-1 p-3 pb-20 sm:p-4 md:p-6 md:pb-6 overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {assistantsStore.pageTitle}
        </h1>
        {assistantsStore.isEditMode && (
          <button
            onClick={() => assistantsStore.handleAddAssistant(navigate)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('assistants.add.title')}
          </button>
        )}
      </div>
      <div className="w-full space-y-4">
        {Object.entries(assistantsStore.groupedAssistants).map(([group, assistants], index) => (
          <GroupSection
            key={group}
            group={group}
            assistants={assistants}
            index={index}
            navigate={navigate}
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
      isEmpty={assistantsStore.isEmpty}
      customMessage={assistantsStore.loadingMessage}
    >
      {assistantsStore.error ? errorContent : mainContent}
    </LoadingState>
  );
});

export default AssistantsPage;