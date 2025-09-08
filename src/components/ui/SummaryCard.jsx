import React from 'react';

const SummaryCard = ({ children }) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-4 mb-4">
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

export default SummaryCard;