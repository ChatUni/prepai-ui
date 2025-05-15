import React from 'react';
import * as FiIcons from 'react-icons/fi';
import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';

const Icon = ({ name = '', size = 16, color }) => {
  if (!name) {
    console.warn('Icon name is required');
    return null;
  }

  // Determine icon set from name prefix
  let IconSet;
  if (name.startsWith('Fi')) {
    IconSet = FiIcons;
  } else if (name.startsWith('Md')) {
    IconSet = MdIcons;
  } else {
    IconSet = FaIcons;
  }

  const IconComponent = IconSet[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon set`);
    return null;
  }

  const getColor = () => {
    if (!color) return 'currentColor';
    return color;
  };

  return <IconComponent size={size} color={getColor()} />;
};

export default Icon;