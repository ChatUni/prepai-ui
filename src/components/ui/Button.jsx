import React from 'react';

const Button = ({ onClick, className = '', icon, children }) => {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center justify-center px-4 py-2 text-white rounded-md text-sm font-medium transition-colors ${className}`}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

export default Button;