import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import store from '../../../stores/assistantStore';
import CardEditActions from '../../ui/CardEditActions';
import DndOrderContainer from '../../ui/DndOrderContainer';

const AssistantCard = observer(({
  assistant,
  isEditMode = false,
  index,
  moveItem,
  group,
}) => {
  const navigate = useNavigate();

  const handleImageError = useCallback((e) => {
    e.target.onerror = null;
  }, []);

  const handleCardClick = (e) => {
    // if (!store.isUserAssistantRoute && isEditMode && e.target.closest('.action-button')) {
    //   return;
    // }
    store.gotoDetail(assistant, navigate);
  };

  return (
    <DndOrderContainer
      isEditMode={isEditMode}
      type={`item-${group}`}
      index={index}
      moveItem={moveItem}
      onDrop={() => store.saveItemGroupOrder()}
      onClick={handleCardClick}
      isClickable={true}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
            <img
              src={assistant.image}
              alt={assistant.name}
              className="w-full h-full object-cover"
              onError={handleImageError}
            />
          </div>
          
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
      
      {isEditMode && (
        <CardEditActions
          item={assistant}
          store={store}
          hideDelete={item => store.isPlatformAssistant(item)}
          hideShelf={item => store.isPlatformAssistant(item)}
          hideVisibility={item => store.isUserAssistantRoute}
        />
      )}
    </DndOrderContainer>
  );
});

export default AssistantCard;