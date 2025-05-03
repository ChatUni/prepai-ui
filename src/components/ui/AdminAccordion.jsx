import React from 'react';
import { observer } from 'mobx-react-lite';
import { useDrag, useDrop } from 'react-dnd';
import { MdDragIndicator } from 'react-icons/md';

const MenuItem = ({ label, onClick }) => (
  <button
    className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
    onClick={onClick}
  >
    <span>{label}</span>
    <span className="text-gray-400">→</span>
  </button>
);

const AccordionSection = observer(({ 
  title, 
  isExpanded, 
  onToggle, 
  maxHeight = '40', 
  children,
  index,
  moveGroup,
  isDraggable = false
}) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: 'group',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [index]);

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: 'group',
    collect: (monitor) => ({
      isOver: monitor.isOver()
    }),
    hover: (item, monitor) => {
      if (!dragDropRef.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) return;

      // Move the item
      moveGroup(dragIndex, hoverIndex);
      
      // Update the index for the dragged item
      item.index = hoverIndex;
    }
  }), [index, moveGroup]);

  const dragDropRef = React.useRef(null);
  const handleRef = (el) => {
    dragRef(el);
    dropRef(el);
    dragDropRef.current = el;
  };

  return (
    <div 
      className={`overflow-hidden rounded-lg ${isExpanded ? 'shadow-lg' : ''} ${isDragging ? 'opacity-50' : ''}`}
    >
      <div
        ref={isDraggable ? handleRef : undefined}
        className={`w-full p-4 flex items-center text-white transition-all duration-200 ${
          isExpanded ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
        } ${isDraggable ? 'cursor-move' : ''} ${
          isOver ? 'border-2 border-yellow-400 transform scale-[1.02]' : ''
        }`}
      >
        {isDraggable && (
          <div className="mr-2 text-gray-200 p-1 rounded bg-blue-700">
            <MdDragIndicator size={24} />
          </div>
        )}
        <div className="flex-1 flex items-center justify-between" onClick={onToggle}>
          <span className="font-semibold">{title}</span>
          <span className={`transform transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}>▼</span>
        </div>
      </div>
      <div className={`transition-all duration-200 ${
        isExpanded
          ? `max-h-${maxHeight} opacity-100`
          : 'max-h-0 opacity-0'
      }`}>
        <div className="bg-white p-2 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
});

export { AccordionSection, MenuItem };