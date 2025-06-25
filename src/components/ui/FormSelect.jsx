import React from 'react';
import { observer } from 'mobx-react-lite';
import { FaPlus } from 'react-icons/fa';
import Dialog from './Dialog';
import uiStore from '../../stores/uiStore';
import { t } from '../../stores/languageStore';

const FormSelect = observer(({
  store,
  field, 
  options,
  onOptionsChange,
  required = false,
  className = '',
  canAdd = false,
  onAdd,
  addDialogPage: AddDialogPage,
  addDialogTitle
}) => {
  const id = `${store.name}-${field}`;
  const onChange = (e) => store.setEditingField(field, e.target.value);

  return (
    <div className={className}>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {t(`${store.name}.${field}`)}
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
        value={store.editingItem[field]}
        onChange={onChange}
        className="w-full p-2 border rounded"
        required={required}
      >
        <option value="">{t(`${store.name}.select${field[0].toUpperCase() + field.slice(1)}`)}</option>
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