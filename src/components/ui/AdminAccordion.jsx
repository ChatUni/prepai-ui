import React from 'react';
import { observer } from 'mobx-react-lite';

const MenuItem = ({ label, onClick }) => (
  <button
    className="w-full p-3 text-left hover:bg-gray-50 rounded flex items-center justify-between"
    onClick={onClick}
  >
    <span>{label}</span>
    <span className="text-gray-400">→</span>
  </button>
);

const AccordionSection = ({ title, isExpanded, onToggle, maxHeight = '40', children }) => (
  <div className="overflow-hidden rounded-lg">
    <button
      className={`w-full p-4 flex items-center justify-between text-white transition-colors duration-200 ${
        isExpanded ? 'bg-blue-600' : 'bg-blue-500 hover:bg-blue-600'
      }`}
      onClick={onToggle}
    >
      <span className="font-semibold">{title}</span>
      <span className={`transform transition-transform duration-200 ${
        isExpanded ? 'rotate-180' : ''
      }`}>▼</span>
    </button>
    <div className={`transition-all duration-200 ${
      isExpanded
        ? `max-h-${maxHeight} opacity-100`
        : 'max-h-0 opacity-0'
    }`}>
      <div className="bg-white p-2 space-y-1">
        {children}
      </div>
    </div>
  </div>
);

export { AccordionSection, MenuItem };