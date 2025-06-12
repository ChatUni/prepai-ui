import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import AssistantCard from './AssistantCard';
import AssistantSearchBar from './AssistantSearchBar';
import Dialog from '../../ui/Dialog';
import EditAssistantPage from './EditAssistantPage';
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
          isEditMode={assistantsStore.isAdminMode}
          onToggleVisibility={assistantsStore.handleToggleVisibility}
          onEdit={assistantsStore.handleEdit}
          onDelete={assistantsStore.handleDelete}
        />
      ))}
    </div>
  </AccordionSection>
));

const AssistantsPage = observer(() => {
  const { t } = languageStore;
  const navigate = useNavigate();

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      <div className="bg-white p-4">
            <h1 className="text-2xl font-semibold pb-4">{assistantsStore.pageTitle}</h1>
        
        {/* Search Bar */}
        {/* <AssistantSearchBar /> */}
        
        {assistantsStore.filteredAssistants.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {assistantsStore.searchQuery
                ? t('common.no_results')
                : t('assistants.noAssistants')
              }
            </p>
          </div>
        ) : (
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
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={assistantsStore.showDeleteDialog}
        onClose={assistantsStore.closeDeleteDialog}
        onConfirm={assistantsStore.confirmDelete}
        title={t('assistants.delete')}
        isConfirm={true}
      >
        <p>
          {assistantsStore.assistantToDelete &&
            t('assistants.confirmDelete', { name: assistantsStore.assistantToDelete.name })
          }
        </p>
      </Dialog>

      {/* Edit Assistant Dialog */}
      <Dialog
        isOpen={assistantsStore.showEditDialog}
        onClose={assistantsStore.closeEditDialog}
        onConfirm={assistantsStore.saveAssistant}
        title={assistantsStore.isEditMode ? t('assistants.edit') : t('assistants.createNew')}
        isConfirm={true}
      >
        <EditAssistantPage />
      </Dialog>
    </div>
  );
});

export default AssistantsPage;