import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator } from 'react-icons/md';
import ExpandArrow from './ExpandArrow';
import DndOrderContainer from './DndOrderContainer';
import seriesStore from '../../stores/seriesStore';

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
  isDraggable = false,
  actions,
  isDanger
}) => {
  return (
    <DndOrderContainer
      isEditMode={isDraggable}
      type="group"
      index={index}
      moveItem={(fromIndex, toIndex) => {
        if (moveGroup && isDraggable && fromIndex !== toIndex) {
          moveGroup(fromIndex, toIndex);
        }
      }}
      onDrop={() => isDraggable && onDrop ? onDrop() : undefined}
      useCardStyles={false}
      className={`overflow-hidden rounded-lg ${isExpanded ? 'shadow-lg' : ''}`}
      customDragClass="opacity-50"
      customOverClass="border-2 border-yellow-400 transform scale-[1.02]"
    >
      {({ isDragging, isOver }) => (
        <>
          <div
            className={`w-full p-4 flex items-center text-white transition-all duration-200 ${
              isExpanded
                ? isDanger ? 'bg-red-500' : 'bg-blue-600'
                : isDanger ? 'bg-red-400 hover:bg-red-500' : 'bg-blue-500 hover:bg-blue-600'
            } ${isDraggable ? 'cursor-move' : ''}`}
          >
            {isDraggable && (
              <div className="mr-2 text-gray-200 p-1 rounded bg-blue-700">
                <MdDragIndicator size={24} />
              </div>
            )}
            <div className="flex-1 flex items-center justify-between" onClick={onToggle}>
              <span className="font-semibold">{title}</span>
              <div className="flex items-center gap-2">
                {actions}
                <ExpandArrow isExpanded={isExpanded} className="ml-2" />
              </div>
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
        </>
      )}
    </DndOrderContainer>
  );
});

export { AccordionSection, MenuItem };