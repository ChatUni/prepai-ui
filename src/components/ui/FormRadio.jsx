import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';
import { buildOptions } from '../../utils/utils';

const FormRadio = observer(({
  store,
  field,
  options = [],
  required = false,
  className = '',
  defaultValue,
  // New props for custom handling
  value,
  onChange,
  label
}) => {
  const id = store && field ? `${store.name}-${field}` : `custom-radio-${Math.random()}`;
  
  // Use custom value if provided, otherwise use store pattern
  let radioValue = value !== undefined ? value : undefined;
  if (radioValue === undefined && store) {
    radioValue = store.editingItem?.[field];
    if (radioValue === undefined) radioValue = store[field];
  }
  if (radioValue === undefined) radioValue = defaultValue;
  
  const opts = buildOptions(options);

  const handleChange = (e) => {
    let v = e.target.value;
    const type = options.length > 0 ? typeof options[0].value : '';
    if (type === 'number') v = parseInt(v);
    if (type === 'boolean') v = v === 'true';
    
    if (onChange) {
      onChange(v);
    } else if (store && field) {
      if (store.isCRUD && store.setEditingItemField) {
        store.setEditingItemField(field, v);
      } else if (store.setField) {
        store.setField(field, v);
      } else {
        const setter = store[`set${field[0].toUpperCase() + field.slice(1)}`];
        setter(v);
      }
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium">
          {label || (store && field ? t(`${store.name}.${field}`) : 'Radio')}
        </label>
        <div className="flex gap-4">
          {opts.map((option) => (
            <label key={option.value} className="inline-flex items-center">
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={radioValue === option.value}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-blue-600"
                required={required}
              />
              <span className="ml-2 text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
});

export default FormRadio;