import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';

const FormInput = observer(({
  store,
  field,
  type = 'text',
  required = false,
  min,
  max,
  rows,
  choices,
  className = '',
  hasTitle = true,
  // New props for custom handling
  value,
  onChange,
  label,
  placeholder,
  defaultValue
}) => {
  const id = store && field ? `${store.name}-${field}` : `custom-input-${Math.random()}`;
  
  // Use custom value/onChange if provided, otherwise use store pattern
  const inputValue = value !== undefined ? value : (store?.editingItem?.[field] || '');
  
  const handleChange = (e) => {
    if (onChange) {
      onChange(e.target.value);
    } else if (store && field) {
      store.setEditingField(field, e.target.value);
    }
  };

  const handleBlur = (e) => {
    if (type === 'number') {
      const numValue = parseFloat(e.target.value);
      let correctedValue = e.target.value;
      
      // Check if value is a valid number
      if (isNaN(numValue)) {
        correctedValue = defaultValue || '';
      } else {
        // Check min/max constraints
        if (min !== undefined && numValue < min) {
          correctedValue = defaultValue || min.toString();
        } else if (max !== undefined && numValue > max) {
          correctedValue = defaultValue || max.toString();
        }
      }
      
      // Update value if correction is needed
      if (correctedValue !== e.target.value) {
        if (onChange) {
          onChange(correctedValue);
        } else if (store && field) {
          store.setEditingField(field, correctedValue);
        }
      }
    }
  };

  const handleChoiceClick = (choice) => {
    if (onChange) {
      onChange(choice);
    } else if (store && field) {
      store.setEditingField(field, choice);
    }
  };

  const inputProps = {
    id,
    value: inputValue,
    onChange: handleChange,
    onBlur: handleBlur,
    className: "w-full p-3 border rounded",
    required,
    placeholder,
  };

  return (
    <div className={className}>
      {hasTitle && (
        <label htmlFor={inputProps.id} className="block text-sm font-medium text-gray-700 mb-1">
          {label || (store && field ? t(`${store.name}.${field}`) : 'Input')}
        </label>
      )}
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
          max={max}
        />
      )}
      {choices && (
        <div className="flex flex-wrap gap-2 mt-4">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${choice === inputValue
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => handleChoiceClick(choice)}
            >
              {choice}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

export default FormInput;