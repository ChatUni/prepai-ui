import React from 'react';
import { observer } from 'mobx-react-lite';
import assistantsStore from '../../../stores/assistantsStore';
import languageStore from '../../../stores/languageStore';
import AssistantCard from './AssistantCard';
import AssistantSearchBar from './AssistantSearchBar';
import GroupedList from '../../ui/GroupedList';
import { GroupNameDialog } from '../../ui/CrudDialogs';

const AssistantsPage = observer(() => {
  const { t } = languageStore;

  return (
    <div className="flex flex-col bg-gray-100 w-full max-w-6xl mx-auto">
      <div className="bg-white p-4">
            <h1 className="text-2xl font-semibold pb-4">{assistantsStore.pageTitle}</h1>
        
        <AssistantSearchBar />
        
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
            isGroupEditable={() => assistantsStore.isAdminMode}
            onItemMove={assistantsStore.moveAssistantInGroup}
            editGroupTitle={t('assistants.groups.editGroup')}
            deleteGroupTitle={t('assistants.groups.deleteGroup')}
            itemType="assistants"
            renderItem={(assistant, index, group, { moveItem, isEditMode }, isFirstCard) => (
              <AssistantCard
                key={assistant.id}
                assistant={assistant}
                index={index}
                group={group}
                moveItem={moveItem}
                isEditMode={isEditMode}
                renderDialogs={isFirstCard}
              />
            )}
          />
        )}
      </div>

      {/* Add Group Dialog */}
      <GroupNameDialog
        isOpen={assistantsStore.showAddGroupDialog}
        onClose={assistantsStore.closeAddGroupDialog}
        onConfirm={assistantsStore.handleAddGroupConfirm}
        title={t('assistants.groups.newGroup')}
        value={assistantsStore.newGroupName}
        onChange={assistantsStore.setNewGroupName}
        placeholder={t('assistants.groups.enterName')}
      />
    </div>
  );
});

export default AssistantsPage;