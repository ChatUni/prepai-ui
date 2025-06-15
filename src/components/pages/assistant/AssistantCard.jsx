import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import assistantsStore from '../../../stores/assistantsStore';
import BaseCard from '../../ui/BaseCard';

const AssistantCard = observer(({
  assistant,
  onClick,
  isEditMode = false,
  onToggleVisibility,
  onEdit,
  onDelete,
  index,
  moveItem,
  group
}) => {
  // Handle image loading errors - defined outside render function to prevent rerenders
  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
    e.target.src = '/images/avatar.png';
  }, []);

  return (
    <BaseCard
      item={assistant}
      index={index}
      group={group}
      moveItem={moveItem}
      isEditMode={isEditMode}
      onClick={onClick}
      onToggleVisibility={onToggleVisibility}
      onEdit={onEdit}
      onDelete={onDelete}
      onDrop={assistantsStore.saveItemGroupOrder}
      className="relative"
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
        </div>
      </div>
    </BaseCard>
  );
});

export default AssistantCard;