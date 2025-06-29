import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';

const FormInput = observer(({
  store,
  field,
  type = 'text',
  required = false,
  min,
  rows,
  className = ''
}) => {
  const inputProps = {
    id: `${store.name}-${field}`,
    value: store.editingItem[field] || '',
    onChange: (e) => store.setEditingField(field, e.target.value),
    className: "w-full p-3 border rounded",
    required,
  };

  return (
    <div className={className}>
      <label htmlFor={inputProps.id} className="block text-sm font-medium text-gray-700 mb-1">
        {t(`${store.name}.${field}`)}
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
});

export default FormInput;