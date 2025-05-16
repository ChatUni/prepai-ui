import React from 'react';
import Icon from './Icon';

const Button = ({
  onClick,
  className = '',
  icon,
  iconSize = 20,
  color = 'blue',
  shade = 600,
  children,
  disabled = false
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center px-4 py-2 text-white bg-${color}-${shade} hover:bg-${color}-${shade + 100} rounded-md text-sm font-medium transition-colors ${className}`}
  >
    {icon && (
      <span className="mr-2">
        <Icon name={icon} size={iconSize} />
      </span>
    )}
    {children}
  </button>
);

export default Button;