import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';

const FormRadio = observer(({
  store,
  field,
  options = [],
  required = false,
  className = ''
}) => {
  const id = `${store.name}-${field}`;
  const value = store.editingItem[field] || store[field];
  const onChange = (e) => {
    const setter = store.setEditingField || store[`set${field[0].toUpperCase() + field.slice(1)}`];
    if (store.setEditingField) {
      store.setEditingField(field, e.target.value);
    } else {
      setter(e.target.value);
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium">
          {t(`${store.name}.${field}`)}
        </label>
        <div className="flex gap-4">
          {options.map((option) => (
            <label key={option.value} className="inline-flex items-center">
              <input
                type="radio"
                name={id}
                value={option.value}
                checked={value === option.value}
                onChange={onChange}
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