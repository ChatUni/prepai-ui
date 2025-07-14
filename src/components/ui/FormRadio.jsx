import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';
import { buildOptions } from '../../utils/utils';

const FormRadio = observer(({
  store,
  field,
  options = [],
  required = false,
  className = '',
  defaultValue
}) => {
  const id = `${store.name}-${field}`;
  let value = store.editingItem[field];
  if (value === undefined) value = store[field];
  if (value === undefined) value = defaultValue;
  const opts = buildOptions(options);

  const onChange = (e) => {
    let v = e.target.value;
    const type = options.length > 0 ? typeof options[0].value : '';
    if (type === 'number') v = parseInt(v);
    if (type === 'boolean') v = v === 'true';
    if (store.setEditingField) {
      store.setEditingField(field, v);
    } else {
      const setter = store[`set${field[0].toUpperCase() + field.slice(1)}`];
      setter(v);
    }
  };

  return (
    <div className={className}>
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium">
          {t(`${store.name}.${field}`)}
        </label>
        <div className="flex gap-4">
          {opts.map((option) => (
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