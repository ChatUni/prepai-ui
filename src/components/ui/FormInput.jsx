import { observer } from 'mobx-react-lite';
import { t } from '../../stores/languageStore';

const FormInput = observer(({
  store,
  field,
  type = 'text',
  required = false,
  min,
  rows,
  choices,
  className = '',
  hasTitle = true
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
      {hasTitle && (
        <label htmlFor={inputProps.id} className="block text-sm font-medium text-gray-700 mb-1">
          {t(`${store.name}.${field}`)}
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
        />
      )}
      {choices && (
        <div className="flex flex-wrap gap-2 mt-4">
          {choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${choice === inputProps.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => store.setEditingField(field, choice)}
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