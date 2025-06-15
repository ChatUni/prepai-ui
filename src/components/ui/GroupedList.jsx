import React from 'react';
import { observer } from 'mobx-react-lite';
import { AccordionSection } from './AdminAccordion';
import ActionButton from './ActionButton';
import languageStore from '../../stores/languageStore';

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
  onGroupDrop
}) => {
  const { t } = languageStore;

  const renderActions = (group) => {
    if (renderGroupActions) {
      return renderGroupActions(group);
    }
    
    if (!isGroupEditable(group) || !isEditMode) {
      return null;
    }

    return (
      <div className="flex items-center gap-2">
        {onEditGroup && (
          <ActionButton
            onClick={() => onEditGroup(group)}
            icon="FiEdit2"
            color="white"
            title={editGroupTitle || t('series.groups.editGroup')}
          />
        )}
        {onDeleteGroup && (
          <ActionButton
            onClick={() => onDeleteGroup(group)}
            icon="FiTrash2"
            color="white"
            title={deleteGroupTitle || t('series.groups.deleteGroup')}
          />
        )}
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
  );
});

export default GroupedList;