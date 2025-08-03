import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import Dialog from './Dialog';
import Icon from './Icon';
import uiStore from '../../stores/uiStore';
import { t } from '../../stores/languageStore';
import { buildOptions } from '../../utils/utils';

const FormSelect = observer(({
  store,
  field,
  options = [],
  onOptionsChange,
  required = false,
  className = '',
  canAdd = false,
  onAdd,
  addDialogPage: AddDialogPage,
  addDialogTitle,
  showSelectedIcon = true,
  // New props for custom handling
  value,
  onChange,
  label,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const id = store && field ? `${store.name}-${field}` : `custom-select-${Math.random()}`;
  const opts = buildOptions(options);
  
  // Use custom value/onChange if provided, otherwise use store pattern
  const selectedValue = value !== undefined ? value : (store?.editingItem?.[field]);
  const selectedOption = opts.find(opt => opt.value === selectedValue);

  const handleSelect = (newValue) => {
    if (onChange) {
      onChange(newValue);
    } else if (store && field) {
      store.setEditingField(field, newValue);
    }
    setIsOpen(false);
  };

  const handleIconClick = (e, url) => {
    e.stopPropagation();
    if (url) {
      window.open(url, '_blank');
    }
  };

  const renderIcon = (option) => {
    if (!option.icon) return null;
    
    if (typeof option.icon === 'string') {
      return (
        <img
          src={option.icon}
          alt=""
          className="w-4 h-4 mr-2 cursor-pointer hover:opacity-80"
          onClick={(e) => handleIconClick(e, option.url)}
        />
      );
    }
    
    return (
      <div
        className="mr-2 cursor-pointer hover:opacity-80"
        onClick={(e) => handleIconClick(e, option.url)}
      >
        <Icon icon={option.icon} size={16} />
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label || (store && field ? t(`${store.name}.${field}`) : 'Select')}
        </label>
        {canAdd && (
          <button
            type="button"
            onClick={() => uiStore.openFormSelectDialog({ onAdd })}
            className="p-0 min-h-0 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <FaPlus size={16} />
          </button>
        )}
      </div>
      
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 border rounded bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={required}
        >
          <div className="flex items-center">
            {selectedOption && showSelectedIcon && renderIcon(selectedOption)}
            <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption ? selectedOption.label : (
                placeholder ||
                (store && field ? t(`${store.name}.select${field[0].toUpperCase() + field.slice(1)}`) : 'Select an option')
              )}
            </span>
          </div>
          <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={12} />
        </button>

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            <div
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-500"
              onClick={() => handleSelect('')}
            >
              {placeholder ||
               (store && field ? t(`${store.name}.select${field[0].toUpperCase() + field.slice(1)}`) : 'Select an option')}
            </div>
            {opts.map(option => (
              <div
                key={option.value}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleSelect(option.value)}
              >
                {renderIcon(option)}
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {uiStore.formSelectDialogOpen && AddDialogPage && (
        <Dialog
          isOpen={true}
          onClose={() => uiStore.closeFormSelectDialog()}
          onConfirm={async () => {
            if (uiStore.formSelectDialogData?.onAdd) {
              const newItem = await uiStore.formSelectDialogData.onAdd();
              if (newItem && onOptionsChange) {
                const newOptions = [...opts, { value: newItem.value, label: newItem.label }];
                onOptionsChange(newOptions);
                handleSelect(newItem.value);
              }
            }
            uiStore.closeFormSelectDialog();
          }}
          title={addDialogTitle}
          isConfirm={true}
        >
          <AddDialogPage />
        </Dialog>
      )}
    </div>
  );
});

export default FormSelect;