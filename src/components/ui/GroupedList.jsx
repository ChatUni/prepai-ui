import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { AccordionSection } from './AdminAccordion';
import ActionButton from './ActionButton';
import languageStore from '../../stores/languageStore';
import { DeleteConfirmDialog, GroupNameDialog, ErrorDialog } from './CrudDialogs';

const GroupedList = observer(({
  groupedItems,
  store,
  renderItem,
  renderGroupActions,
  onEditGroup,
  onDeleteGroup,
  editGroupTitle,
  deleteGroupTitle,
  isEditMode,
  itemsContainerClassName = "space-y-3 p-2",
  isGroupEditable = () => true,
  isGroupDanger = () => false,
  onItemMove,
  onGroupDrop,
  // Group management props
  itemType = "items"
}) => {
  const { t } = languageStore;

  // Group management dialog states
  const [isAddGroupDialogOpen, setIsAddGroupDialogOpen] = useState(false);
  const [isEditGroupDialogOpen, setIsEditGroupDialogOpen] = useState(false);
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false);
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupToEdit, setGroupToEdit] = useState(null);
  const [groupToDelete, setGroupToDelete] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Group management methods
  const openAddGroupDialog = () => {
    setNewGroupName('');
    setIsAddGroupDialogOpen(true);
  };

  const closeAddGroupDialog = () => {
    setIsAddGroupDialogOpen(false);
    setNewGroupName('');
  };

  const openEditGroupDialog = (group) => {
    setGroupToEdit(group);
    setNewGroupName(group);
    setIsEditGroupDialogOpen(true);
  };

  const closeEditGroupDialog = () => {
    setIsEditGroupDialogOpen(false);
    setGroupToEdit(null);
    setNewGroupName('');
  };

  const openDeleteGroupDialog = (group) => {
    setGroupToDelete(group);
    setIsDeleteGroupDialogOpen(true);
  };

  const closeDeleteGroupDialog = () => {
    setIsDeleteGroupDialogOpen(false);
    setGroupToDelete(null);
  };

  const openErrorDialog = (message) => {
    setErrorMessage(message);
    setIsErrorDialogOpen(true);
  };

  const closeErrorDialog = () => {
    setIsErrorDialogOpen(false);
    setErrorMessage('');
  };

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      if (store.addGroup) {
        await store.addGroup(newGroupName.trim());
      }
      closeAddGroupDialog();
    } catch (error) {
      console.error('Error adding group:', error);
      openErrorDialog('Failed to add group');
    }
  };

  const handleEditGroup = async () => {
    if (!newGroupName.trim() || !groupToEdit) return;

    try {
      if (store.editGroup) {
        await store.editGroup(groupToEdit, newGroupName.trim());
      }
      closeEditGroupDialog();
    } catch (error) {
      console.error('Error editing group:', error);
      openErrorDialog('Failed to edit group');
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      if (store.deleteGroup) {
        await store.deleteGroup(groupToDelete);
      }
      closeDeleteGroupDialog();
    } catch (error) {
      console.error('Error deleting group:', error);
      openErrorDialog('Failed to delete group');
    }
  };

  const handleGroupEdit = (group) => {
    if (onEditGroup) {
      onEditGroup(group);
    } else {
      openEditGroupDialog(group);
    }
  };

  const handleGroupDelete = (group) => {
    if (onDeleteGroup) {
      onDeleteGroup(group);
    } else {
      // Check if group has items
      const groupItems = groupedItems[group] || [];
      if (groupItems.length > 0) {
        openErrorDialog(t(`${itemType}.groups.cannotDelete`));
        return;
      }
      openDeleteGroupDialog(group);
    }
  };

  const renderActions = (group) => {
    if (renderGroupActions) {
      return renderGroupActions(group);
    }
    
    if (!isGroupEditable(group) || !isEditMode) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        <ActionButton
          onClick={() => handleGroupEdit(group)}
          icon="FiEdit2"
          color="white"
          title={editGroupTitle || t(`${itemType}.groups.editGroup`)}
        />
        <ActionButton
          onClick={() => handleGroupDelete(group)}
          icon="FiTrash2"
          color="white"
          title={deleteGroupTitle || t(`${itemType}.groups.deleteGroup`)}
        />
      </div>
    );
  };

  const GroupSection = observer(({ group, items, index }) => (
    <AccordionSection
      key={group}
      title={`${group} (${items.length})`}
      actions={renderActions(group)}
      isExpanded={store.isGroupExpanded(group)}
      onToggle={() => store.toggleGroup(group)}
      maxHeight="96"
      index={index}
      moveGroup={(fromIndex, toIndex) => store.moveGroup(fromIndex, toIndex)}
      onDrop={onGroupDrop || (() => store.saveGroupOrder())}
      isDraggable={isEditMode && isGroupEditable(group)}
      isDanger={isGroupDanger(group)}
    >
      <div className={itemsContainerClassName}>
        {items.map((item, itemIndex) => 
          renderItem(item, itemIndex, group, {
            moveItem: onItemMove ? (fromIndex, toIndex) => {
              if (isEditMode) {
                onItemMove(group, fromIndex, toIndex);
              }
            } : undefined,
            isEditMode
          })
        )}
      </div>
    </AccordionSection>
  ));

  return (
    <>
      <div className="w-full space-y-4">
        {Object.entries(groupedItems).map(([group, items], index) => (
          <GroupSection
            key={group}
            group={group}
            items={items}
            index={index}
          />
        ))}
      </div>

      {/* Group Management Dialogs */}
      <GroupNameDialog
        isOpen={isAddGroupDialogOpen}
        onClose={closeAddGroupDialog}
        onConfirm={handleAddGroup}
        title={t(`${itemType}.groups.newGroup`)}
        value={newGroupName}
        onChange={setNewGroupName}
        placeholder={t(`${itemType}.groups.enterName`)}
      />

      <GroupNameDialog
        isOpen={isEditGroupDialogOpen}
        onClose={closeEditGroupDialog}
        onConfirm={handleEditGroup}
        title={t(`${itemType}.groups.editGroup`)}
        value={newGroupName}
        onChange={setNewGroupName}
        placeholder={t(`${itemType}.groups.enterName`)}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteGroupDialogOpen}
        onClose={closeDeleteGroupDialog}
        onConfirm={handleDeleteGroup}
        item={{ name: groupToDelete }}
        itemType={`${itemType}.groups`}
      />

      <ErrorDialog
        isOpen={isErrorDialogOpen}
        onClose={closeErrorDialog}
        message={errorMessage}
      />
    </>
  );
});

export default GroupedList;