import React from 'react';

const Icon = ({ icon: IconComponent, size = 16, color, onClick }) => {
  if (!IconComponent) {
    console.warn('Icon component is required');
    return null;
  }

  const getColor = () => {
    if (!color) return 'currentColor';
    return color;
  };

  const icon = <IconComponent size={size} color={getColor()} />
  return onClick
    ? <a href="#" onClick={onClick}>{icon}</a>
    : icon;
};

export default Icon;
