import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { AccordionSection } from './AdminAccordion';
import ActionButton from './ActionButton';
import { t } from '../../stores/languageStore';
import { GroupNameDialog, ErrorDialog, GroupDeleteDialog } from './Dialogs';

const GroupedList = observer(({
  store,
  renderItem,
  renderGroupActions,
  editGroupTitle,
  deleteGroupTitle,
  isEditMode,
  itemsContainerClassName = "space-y-3",
  onItemMove,
  itemType = "items",
  isGrouped = true
}) => {
  // Sync initial group order with store
  useEffect(() => {
    if (store.groupOrder && store.groupOrder.length > 0) {
      store.setGroupOrder(store.groupOrder);
    }
  }, [store.groupOrder]);

  const renderActions = (group) => {
    if (renderGroupActions) {
      return renderGroupActions(group);
    }
    
    if (!store.isGroupEditable(group) || !isEditMode) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        <ActionButton
          onClick={() => store.openEditGroupDialog(group)}
          icon={FiEdit}
          color="white"
          title={editGroupTitle || t(`${itemType}.groups.editGroup`)}
        />
        <ActionButton
          onClick={() => store.openDeleteGroupDialog(group)}
          icon={FiTrash2}
          color="white"
          title={deleteGroupTitle || t(`${itemType}.groups.deleteGroup`)}
        />
      </div>
    );
  };

  const GroupSection = observer(({ group, items, index, isFirstGroup }) => (
    <AccordionSection
      key={group}
      title={`${group} (${items.length})`}
      actions={renderActions(group)}
      isExpanded={store.isGroupExpanded(group)}
      onToggle={() => store.toggleGroup(group)}
      index={index}
      moveGroup={(fromIndex, toIndex) => {
        store.moveGroup(fromIndex, toIndex);
      }}
      onDrop={() => store.saveGroupOrder()}
      isDraggable={isEditMode && store.isGroupEditable(group)}
      isDanger={store.isGroupDanger && store.isGroupDanger(group)}
    >
      <div className={`${itemsContainerClassName} p-2`}>
        {items.map((item, itemIndex) =>
          renderItem(item, itemIndex, group, {
            moveItem: onItemMove ? (fromIndex, toIndex) => {
              if (isEditMode) {
                onItemMove(group, fromIndex, toIndex);
              }
            } : undefined,
            isEditMode
          }, isFirstGroup && itemIndex === 0)
        )}
      </div>
    </AccordionSection>
  ));

  return (
    <>
      <div className="w-full space-y-4">
        {isGrouped ? (
          // Render grouped items with accordion sections
          Object.entries(store.groupedItems).map(([group, items], index) => (
            <GroupSection
              key={group}
              group={group}
              items={items}
              index={index}
              isFirstGroup={index === 0}
            />
          ))
        ) : (
          // Render flat list without groups
          <div
            className={itemsContainerClassName}
            onDrop={() => store.saveItemGroupOrder()}
          >
            {(store.filteredItems || []).map((item, itemIndex) =>
              renderItem(item, itemIndex, item.originalGroup, {
                moveItem: onItemMove ? (fromIndex, toIndex) => {
                  if (isEditMode) {
                    onItemMove(item.originalGroup, fromIndex, toIndex);
                  }
                } : undefined,
                isEditMode
              }, itemIndex === 0)
            )}
          </div>
        )}
      </div>

      {/* Group Management Dialogs */}
      <GroupNameDialog store={store} />
      <GroupNameDialog store={store} isEdit={true} />
      <GroupDeleteDialog store={store} />
    </>
  );
});

export default GroupedList;
