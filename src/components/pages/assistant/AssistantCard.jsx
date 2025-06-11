import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { FiEye, FiEyeOff, FiEdit, FiTrash2 } from 'react-icons/fi';
import { getCardBaseClasses } from '../../../utils/cardStyles';
import languageStore from '../../../stores/languageStore';
import ActionButton from '../../ui/ActionButton';

const AssistantCard = observer(({
  assistant,
  onClick,
  isEditMode = false,
  onToggleVisibility,
  onEdit,
  onDelete
}) => {
  const { t } = languageStore;
  // Handle image loading errors - defined outside render function to prevent rerenders
  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = '/images/avatar.png';
  }, []);

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on action buttons
    if (isEditMode && e.target.closest('.action-button')) {
      return;
    }
    onClick(assistant);
  };

  const handleToggleClick = (e) => {
    e.stopPropagation();
    onToggleVisibility(assistant);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    onEdit(assistant);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    onDelete(assistant);
  };

  return (
    <div
      className={getCardBaseClasses(false, false, !isEditMode)}
      onClick={handleCardClick}
    >
      <div className="p-4">
        {/* Horizontal layout with image on left and content on right */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            <img
              src={assistant.image || '/images/avatar.png'}
              alt={assistant.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {assistant.name}
            </h3>
            {assistant.desc && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {assistant.desc}
              </p>
            )}
          </div>

          {/* Action buttons for edit mode */}
          {isEditMode && (
            <div className="flex gap-2 flex-shrink-0">
              <ActionButton
                onClick={handleToggleClick}
                color="blue"
                icon={assistant.hidden ? 'FiEyeOff' : 'FiEye'}
                title={assistant.hidden ? t('series.show') : t('series.hide')}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default AssistantCard;