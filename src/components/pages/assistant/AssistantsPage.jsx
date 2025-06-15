import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import AssistantCard from './AssistantCard';
import AssistantSearchBar from './AssistantSearchBar';
import EditAssistantPage from './EditAssistantPage';
import GroupedList from '../../ui/GroupedList';
import { DeleteConfirmDialog, VisibilityConfirmDialog, EditDialog } from '../../ui/CrudDialogs';

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
          <GroupedList
            groupedItems={assistantsStore.groupedAssistants}
            store={assistantsStore}
            isEditMode={assistantsStore.isAdminMode}
            onItemMove={assistantsStore.moveAssistantInGroup}
            renderItem={(assistant, index, group, { moveItem, isEditMode }) => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                index={index}
                group={group}
                moveItem={moveItem}
                onClick={(assistant) => assistantsStore.handleAssistantClick(assistant, navigate)}
                isEditMode={isEditMode}
                onToggleVisibility={assistantsStore.handleToggleVisibility}
                onEdit={assistantsStore.handleEdit}
                onDelete={assistantsStore.handleDelete}
              />
            )}
          />
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={assistantsStore.showDeleteDialog}
        onClose={assistantsStore.closeDeleteDialog}
        onConfirm={assistantsStore.confirmDelete}
        item={assistantsStore.itemToDelete}
        itemType="assistants"
      />

      {/* Visibility Confirmation Dialog */}
      <VisibilityConfirmDialog
        isOpen={assistantsStore.showVisibilityDialog}
        onClose={assistantsStore.closeVisibilityDialog}
        onConfirm={assistantsStore.confirmVisibilityChange}
        item={assistantsStore.currentItem}
        itemType="assistants"
      />

      {/* Edit Assistant Dialog */}
      <EditDialog
        isOpen={assistantsStore.showEditDialog}
        onClose={assistantsStore.closeEditDialog}
        onConfirm={assistantsStore.saveAssistant}
        title={assistantsStore.isEditMode ? t('assistants.edit') : t('assistants.createNew')}
      >
        <EditAssistantPage />
      </EditDialog>
    </div>
  );
});

export default AssistantsPage;