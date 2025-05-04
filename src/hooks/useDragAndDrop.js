import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

const useDragAndDrop = ({ type, index, moveItem, onDrop }) => {
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [index]);

  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: type,
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
      moveItem(dragIndex, hoverIndex);
      
      // Update the index for the dragged item
      item.index = hoverIndex;
    },
    drop: (item) => {
      if (onDrop) {
        onDrop(item.index);
      }
    }
  }), [index, moveItem, onDrop]);

  const dragDropRef = useRef(null);
  const handleRef = (el) => {
    dragRef(el);
    dropRef(el);
    dragDropRef.current = el;
  };

  return {
    isDragging,
    isOver,
    handleRef
  };
};

export default useDragAndDrop;