import React from 'react';
import * as FiIcons from 'react-icons/fi';
import * as FaIcons from 'react-icons/fa';

const Icon = ({ name, size = 16 }) => {
  // Determine icon set from name prefix
  const isFeatherIcon = name.startsWith('Fi');
  const IconSet = isFeatherIcon ? FiIcons : FaIcons;

  // Get icon name without prefix for Font Awesome icons
  const IconComponent = IconSet[name];

  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in ${isFeatherIcon ? 'Feather' : 'Font Awesome'} icon set`);
    return null;
  }

  return <IconComponent size={size} />;
};

export default Icon;