import React from 'react';

const MenuListItem = ({ label, onClick, extraInfo }) => {
  return (
    <div
      className="mb-3 text-center"
      onClick={onClick}
    >
      <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
        <div>
          <span className="text-base mr-2">{label}</span>
          {extraInfo && <span className="text-gray-500 text-sm">{extraInfo}</span>}
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  );
};

export default MenuListItem;