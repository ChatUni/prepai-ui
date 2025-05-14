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
      className={`p-1 ${
        color === 'white'
          ? 'text-white/70 hover:text-white'
          : `text-${color}-500 hover:text-${color}-800`
      } transition-colors`}
      title={title}
    >
      <Icon name={icon} size={size} />
    </button>
  );
};

export default ActionButton;