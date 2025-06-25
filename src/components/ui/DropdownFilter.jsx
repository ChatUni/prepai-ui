import { observer } from 'mobx-react-lite';

const DropdownFilter = observer(({
  selectedValue,
  items,
  onSelect,
  buttonClassName,
}) => {
  const handleChange = (event) => {
    onSelect(event.target.value);
  };

  return (
    <div className="relative shrink-0">
      <select
        value={selectedValue || ''}
        onChange={handleChange}
        className={buttonClassName || "bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg text-sm sm:text-base w-full sm:w-auto appearance-none cursor-pointer"}
      >
        {items.map(item => (
          <option
            key={item.id || item.value}
            value={item.id || item.value}
            className="text-black bg-white"
          >
            {item.name || item.label}
          </option>
        ))}
      </select>
    </div>
  );
});

export default DropdownFilter;