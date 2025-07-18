import { observer } from 'mobx-react-lite';
import { useNavigate } from 'react-router-dom';
import store from '../../../stores/examStore';
import CardEditActions from '../../ui/CardEditActions';
import EditExamPage from './EditExamPage';
import DndOrderContainer from '../../ui/DndOrderContainer';

const ExamCard = observer(({
  exam,
  isEditMode = false,
  index,
  moveItem,
  group,
  renderDialogs
}) => {
  const navigate = useNavigate();

  const handleCardClick = (e) => {
    // Don't trigger card click if clicking on action buttons
    if (isEditMode && e.target.closest('.action-button')) {
      return;
    }
    store.gotoDetail(exam, navigate);
  };

  return (
    <DndOrderContainer
      isEditMode={isEditMode}
      type={`item-${group}`}
      index={index}
      moveItem={moveItem}
      onDrop={() => store.saveItemGroupOrder()}
      onClick={handleCardClick}
      isClickable={!isEditMode}
    >
      <div className="p-4">
        {/* Horizontal layout with image on left and content on right */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gray-200 overflow-hidden flex-shrink-0">
            <img
              src={exam.image}
              alt={exam.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {exam.name}
            </h3>
            {exam.desc && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {exam.desc}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Action buttons for edit mode */}
      {isEditMode && (
        <CardEditActions
          item={exam}
          store={store}
        />
      )}
    </DndOrderContainer>
  );
});

export default ExamCard;