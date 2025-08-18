import React from 'react';
import { FiChevronRight } from 'react-icons/fi';

const MenuListItem = ({ label, onClick, extraInfo, icon: Icon, iconColor = 'text-blue-500' }) => {
  return (
    <div
      className="mb-3 text-center"
      onClick={onClick}
    >
      <div className="bg-white p-4 rounded-lg shadow-sm w-full flex items-center justify-between">
        <div className="flex items-center">
          {Icon && (
            <div className={`mr-3 p-2 rounded-lg bg-gray-100 ${iconColor}`}>
              <Icon className="h-5 w-5" />
            </div>
          )}
          <div>
            <span className="text-base mr-2">{label}</span>
            {extraInfo && <span className="text-gray-500 text-sm">{extraInfo}</span>}
          </div>
        </div>
        <FiChevronRight className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );
};

export default MenuListItem;