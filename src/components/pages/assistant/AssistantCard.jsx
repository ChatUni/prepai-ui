import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import store from '../../../stores/assistantStore';
import CardEditActions from '../../ui/CardEditActions';
import EditAssistantPage from './EditAssistantPage';
import DndOrderContainer from '../../ui/DndOrderContainer';

const AssistantCard = observer(({
  assistant,
  isEditMode = false,
  index,
  moveItem,
  group,
  renderDialogs
}) => {
  const navigate = useNavigate();

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
    store.handleItemClick(assistant, navigate);
  };

  return (
    <DndOrderContainer
      isEditMode={isEditMode}
      type={`item-${group}`}
      index={index}
      moveItem={moveItem}
      onDrop={store.saveItemGroupOrder}
      onClick={handleCardClick}
      isClickable={!isEditMode}
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
      
      {/* Action buttons for edit mode */}
      {isEditMode && (
        <CardEditActions
          item={assistant}
          store={store}
          hideDelete={item => item.type === 1}
        />
      )}
    </DndOrderContainer>
  );
});

export default AssistantCard;