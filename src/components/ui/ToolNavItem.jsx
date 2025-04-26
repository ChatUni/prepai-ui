import React from 'react';

const ToolNavItem = ({ onClick, title, bgColor, icon }) => (
  <div className="flex flex-col items-center cursor-pointer" onClick={onClick}>
    <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mb-2 hover:opacity-90 transition-colors`}>
      {icon}
    </div>
    <span className="text-sm text-gray-600 dark:text-gray-400">{title}</span>
  </div>
);

export default ToolNavItem;