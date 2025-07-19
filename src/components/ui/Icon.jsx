import React from 'react';

const Icon = ({ icon: IconComponent, size = 16, color }) => {
  if (!IconComponent) {
    console.warn('Icon component is required');
    return null;
  }

  const getColor = () => {
    if (!color) return 'currentColor';
    return color;
  };

  return <IconComponent size={size} color={getColor()} />;
};

export default Icon;
