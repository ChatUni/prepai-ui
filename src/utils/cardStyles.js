// Shared card styling utilities
export const getCardBaseClasses = (isDragging = false, isOver = false, isClickable = true) => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] transition-shadow duration-300 overflow-hidden';
  const dragClasses = isDragging ? 'opacity-50' : '';
  const overClasses = isOver ? 'border-2 border-blue-500' : '';
  const clickableClasses = isClickable ? 'cursor-pointer' : '';
  
  return `${baseClasses} ${dragClasses} ${overClasses} ${clickableClasses}`.trim();
};