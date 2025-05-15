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
      className="p-1 hover:opacity-80 transition-opacity"
      title={title}
    >
      <Icon name={icon} size={size} color={color} />
    </button>
  );
};

export default ActionButton;