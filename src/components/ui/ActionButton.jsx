import React from 'react';
import Icon from './Icon';

const ActionButton = ({
  onClick,
  icon,
  color = 'gray',
  size = 16,
  title
}) => {
  const handleClick = (e) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <button
      onClick={handleClick}
      className={`action-button p-2 text-${color}-600 hover:bg-${color}-50 rounded-lg transition-colors`}
      title={title}
    >
      <Icon name={icon} size={size} color={color} />
    </button>
  );
};

export default ActionButton;