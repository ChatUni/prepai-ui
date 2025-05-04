import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator } from 'react-icons/md';
import useDragAndDrop from '../../hooks/useDragAndDrop';
import coursesStore from '../../stores/coursesStore';

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
  onDrop,
  isDraggable = false
}) => {
  const { isDragging, isOver, handleRef } = useDragAndDrop({
    type: 'group',
    index,
    moveItem: (fromIndex, toIndex) => {
      if (moveGroup && isDraggable && fromIndex !== toIndex) {
        moveGroup(fromIndex, toIndex);
      }
    },
    onDrop: () => {
      if (isDraggable) {
        coursesStore.saveGroupOrder().catch(error => {
          console.error('Failed to save group order:', error);
        });
      }
    }
  });

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