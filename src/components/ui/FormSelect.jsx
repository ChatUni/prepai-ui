import React from 'react';
import { observer } from 'mobx-react-lite';
import { FaPlus } from 'react-icons/fa';
import Dialog from './Dialog';
import uiStore from '../../stores/uiStore';

const FormSelect = observer(({ 
  id, 
  label, 
  value, 
  onChange, 
  options,
  onOptionsChange,
  placeholder,
  required = false,
  className = '',
  canAdd = false,
  onAdd,
  addDialogPage: AddDialogPage,
  addDialogTitle
}) => {
  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
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
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="w-full p-2 border rounded"
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {uiStore.formSelectDialogOpen && AddDialogPage && (
        <Dialog
          isOpen={true}
          onClose={() => uiStore.closeFormSelectDialog()}
          onConfirm={async () => {
            if (uiStore.formSelectDialogData?.onAdd) {
              const newItem = await uiStore.formSelectDialogData.onAdd();
              if (newItem && onOptionsChange) {
                const newOptions = [...options, { value: newItem.value, label: newItem.label }];
                onOptionsChange(newOptions);
                onChange({ target: { value: newItem.value } });
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