import React from 'react';

const FormInput = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  min,
  rows,
  className = ''
}) => {
  const inputProps = {
    id,
    value,
    onChange,
    className: "w-full p-3 border rounded",
    required,
  };

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {rows ? (
        <textarea
          {...inputProps}
          rows={rows}
        />
      ) : (
        <input
          {...inputProps}
          type={type}
          min={min}
        />
      )}
    </div>
  );
};

export default FormInput;