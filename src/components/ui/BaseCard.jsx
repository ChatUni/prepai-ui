import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator } from 'react-icons/md';
import { getCardBaseClasses } from '../../utils/cardStyles';
import ActionButton from './ActionButton';
import useDragAndDrop from '../../hooks/useDragAndDrop';
import languageStore from '../../stores/languageStore';

const BaseCard = observer(({
  item,
  index,
  group,
  moveItem,
  isEditMode = false,
  onClick,
  onToggleVisibility,
  onEdit,
  onDelete,
  onDrop,
  children,
  className = ""
}) => {
  const { t } = languageStore;

  // Drag and drop functionality
  const { isDragging, isOver, handleRef } = useDragAndDrop({
    type: `item-${group}`,
    index,
    moveItem,
    onDrop
  });

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on action buttons
    if (isEditMode && e.target.closest('.action-button')) {
      return;
    }
    if (onClick) onClick(item);
  };

  const handleToggleClick = (e) => {
    e.stopPropagation();
    if (onToggleVisibility) onToggleVisibility(item);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    if (onEdit) onEdit(item);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(item);
  };

  return (
    <div
      ref={isEditMode ? handleRef : null}
      className={`${getCardBaseClasses(isDragging, isOver, !isEditMode)} ${className}`}
      onClick={handleCardClick}
    >
      {children}
      
      {/* Action buttons for edit mode */}
      {isEditMode && (
        <div className="absolute bottom-2 right-2 flex gap-2 items-center bg-white/90 rounded-lg p-1">
          {item.deleted ? (
            <ActionButton
              onClick={handleDeleteClick}
              color="green"
              icon="MdRestoreFromTrash"
              title={t('common.restore')}
            />
          ) : (
            <>
              <ActionButton
                onClick={handleToggleClick}
                color="blue"
                icon={item.hidden ? 'FiEyeOff' : 'FiEye'}
                title={item.hidden ? t('series.show') : t('series.hide')}
              />
              <ActionButton
                onClick={handleEditClick}
                color="green"
                icon="FiEdit"
                title={t('common.edit')}
              />
              <ActionButton
                onClick={handleDeleteClick}
                color="red"
                icon="FiTrash2"
                title={t('common.delete')}
              />
              <MdDragIndicator
                className="text-gray-400 text-xl cursor-move"
                aria-label="Drag to reorder"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
});

export default BaseCard;