import React from 'react';
import Icon from './Icon';

const colorClasses = {
  amber: 'bg-amber-500 hover:bg-amber-600',
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  gray: 'bg-gray-500 hover:bg-gray-600',
  red: 'bg-red-600 hover:bg-red-700',
  purple: 'bg-purple-500 hover:bg-purple-600'
};

const Button = ({
  onClick,
  className = '',
  icon,
  iconSize = 20,
  color = 'blue',
  children,
  disabled = false
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center px-4 py-2 text-white ${disabled ? 'bg-gray-400 cursor-not-allowed' : colorClasses[color]} rounded-md text-sm font-medium transition-colors ${className}`}
  >
    {icon && (
      <span className="mr-2">
        <Icon icon={icon} size={iconSize} />
      </span>
    )}
    {children}
  </button>
);

const StickyButton = ({
  onClick,
  className = '',
  icon,
  iconSize = 20,
  color = 'blue',
  children,
  disabled = false
}) => (
  <div className={`fixed bottom-12 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg`}>
    <div className="max-w-6xl mx-auto">
      <Button
        onClick={onClick}
        disabled={disabled}
        icon={icon}
        iconSize={iconSize}
        color={color}
        className={`w-full py-4 text-lg font-medium ${className}`}
      >
        {children}
      </Button>
    </div>
  </div>
);

export default Button;
export { StickyButton };
