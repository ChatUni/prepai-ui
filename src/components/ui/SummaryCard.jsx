import React from 'react';

const SummaryCard = ({ children }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      <div className="grid grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
};

export default SummaryCard;