import { observer } from 'mobx-react-lite';
import useDragAndDrop from '../../hooks/useDragAndDrop';
import { getCardBaseClasses } from '../../utils/cardStyles';

const DndOrderContainer = observer(({
  children,
  isEditMode = false,
  type,
  index,
  moveItem,
  onDrop,
  onClick,
  className = '',
  isClickable = true,
  useCardStyles = true,
  customDragClass = '',
  customOverClass = ''
}) => {
  // Drag and drop functionality
  const { isDragging, isOver, handleRef } = useDragAndDrop({
    type,
    index,
    moveItem,
    onDrop
  });

  const getClasses = () => {
    if (useCardStyles) {
      return `${getCardBaseClasses(isDragging, isOver, isClickable)} relative ${className}`;
    }
    
    // Custom styling approach
    let classes = className;
    if (isDragging && customDragClass) {
      classes += ` ${customDragClass}`;
    }
    if (isOver && customOverClass) {
      classes += ` ${customOverClass}`;
    }
    return classes;
  };

  return (
    <div
      ref={isEditMode ? handleRef : null}
      className={getClasses()}
      onClick={onClick}
    >
      {typeof children === 'function' ? children({ isDragging, isOver }) : children}
    </div>
  );
});

export default DndOrderContainer;