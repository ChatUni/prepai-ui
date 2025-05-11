import React from 'react';

const ExpandArrow = ({ isExpanded, className = '' }) => (
  <span 
    className={`transform transition-transform duration-200 ${
      isExpanded ? 'rotate-180' : ''
    } ${className}`}
  >
    ▼
  </span>
);

export default ExpandArrow;