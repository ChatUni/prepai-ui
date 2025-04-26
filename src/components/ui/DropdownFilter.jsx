import { observer } from 'mobx-react-lite';

const DropdownFilter = observer(({
  isOpen,
  onToggle,
  selectedValue,
  displayValue,
  items,
  onSelect,
  dropdownRef,
  buttonClassName,
  itemClassName
}) => {
  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        className={buttonClassName || "bg-blue-500 hover:bg-blue-700 text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 rounded-lg flex items-center whitespace-nowrap min-w-max text-sm sm:text-base w-full sm:w-auto justify-between"}
        onClick={onToggle}
      >
        <span className="truncate max-w-[200px]">
          {displayValue}
        </span>
        <svg
          className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d={isOpen ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"}
          />
        </svg>
      </button>
      
      {isOpen && (
        <div
          className="absolute z-10 mt-1 bg-white rounded-md shadow-lg whitespace-nowrap"
        >
          <ul className="py-1 max-h-60 overflow-y-auto w-max min-w-full">
            {items.map(item => (
              <li
                key={item.id || item.value}
                className={`${itemClassName || 'px-3 sm:px-4 py-1.5 sm:py-2 hover:bg-blue-100 cursor-pointer text-sm sm:text-base'} ${selectedValue === (item.id || item.value) ? 'bg-blue-50' : ''}`}
                onClick={() => onSelect(item.id || item.value)}
              >
                {item.name || item.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

export default DropdownFilter;