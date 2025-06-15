import React from 'react';
import Icon from './Icon';

const colorClasses = {
  gray: 'text-gray-600 hover:bg-gray-50',
  blue: 'text-blue-600 hover:bg-blue-50',
  green: 'text-green-600 hover:bg-green-50',
  red: 'text-red-600 hover:bg-red-50',
  yellow: 'text-yellow-600 hover:bg-yellow-50',
  purple: 'text-purple-600 hover:bg-purple-50',
  indigo: 'text-indigo-600 hover:bg-indigo-50',
  pink: 'text-pink-600 hover:bg-pink-50',
  white: 'text-white hover:bg-white/20'
};

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

  const colorClass = colorClasses[color] || colorClasses.gray;

  return (
    <button
      onClick={handleClick}
      className={`action-button p-2 ${colorClass} rounded-lg transition-colors`}
      title={title}
    >
      <Icon name={icon} size={size} color={color} />
    </button>
  );
};

export default ActionButton;