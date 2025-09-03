import React, { useState, useRef, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { FaPlus, FaChevronDown, FaPlay, FaStop, FaSpinner } from 'react-icons/fa';
import Dialog from './Dialog';
import Icon from './Icon';
import uiStore from '../../stores/uiStore';
import { t } from '../../stores/languageStore';
import { buildOptions } from '../../utils/utils';

const FormSelect = observer(({
  store,
  field,
  options = [],
  onOptionsChange,
  required = false,
  className = '',
  canAdd = false,
  onAdd,
  addDialogPage: AddDialogPage,
  addDialogTitle,
  showSelectedIcon = true,
  value,
  onChange,
  label,
  placeholder,
  displayMode = 'dropdown',
  cols = 5
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [loadingAudioUrl, setLoadingAudioUrl] = useState(null);
  const [playingAudioUrl, setPlayingAudioUrl] = useState(null);
  const [hoveredAudioUrl, setHoveredAudioUrl] = useState(null);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);
  const currentAudioRef = useRef(null);
  const currentAudioUrlRef = useRef(null);
  const id = store && field ? `${store.name}-${field}` : `custom-select-${Math.random()}`;
  const opts = buildOptions(options);
  
  // Use custom value/onChange if provided, otherwise use store pattern
  const selectedValue = value !== undefined ? value : (store?.editingItem?.[field]);
  const selectedOption = opts.find(opt => opt.value === selectedValue);

  const handleSelect = (v) => {
    if (onChange) {
      onChange(value);
    } else if (store && field) {
      if (store.isCRUD)
        store.setEditingItemField(field, v);
      else
        store.setField(field, v);
    }
    if (displayMode === 'dropdown') {
      setIsOpen(false);
    }
  };

  const handleIconClick = (e, url) => {
    e.stopPropagation();
    if (url) {
      // Check if URL is an audio file (mp3, wav, ogg, etc.)
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
      const isAudioFile = audioExtensions.some(ext => url.toLowerCase().includes(ext));
      
      if (isAudioFile) {
        // Check if clicking the same audio that's currently playing
        if (currentAudioRef.current && currentAudioUrlRef.current === url && playingAudioUrl === url) {
          // Stop the current audio if it's the same one
          currentAudioRef.current.src = '';
          currentAudioRef.current = null;
          currentAudioUrlRef.current = null;
          setPlayingAudioUrl(null);
          setLoadingAudioUrl(null);
          return;
        }
        
        // Stop any currently playing audio
        if (currentAudioRef.current) {
          currentAudioRef.current.src = '';
        }
        
        // Set loading state
        setLoadingAudioUrl(url);
        setPlayingAudioUrl(null);
        
        // Play the new audio
        const audio = new Audio(url);
        currentAudioRef.current = audio;
        currentAudioUrlRef.current = url;
        
        // Handle when audio can start playing
        audio.addEventListener('canplay', () => {
          setLoadingAudioUrl(null);
          setPlayingAudioUrl(url);
        });
        
        // Clean up references when audio ends
        audio.addEventListener('ended', () => {
          currentAudioRef.current = null;
          currentAudioUrlRef.current = null;
          setPlayingAudioUrl(null);
          setLoadingAudioUrl(null);
        });
        
        audio.play().catch(error => {
          console.error('Error playing audio:', error);
          // Clean up references on error
          currentAudioRef.current = null;
          currentAudioUrlRef.current = null;
          setPlayingAudioUrl(null);
          setLoadingAudioUrl(null);
          // Fallback to opening in new tab if audio playback fails
          window.open(url, '_blank');
        });
      } else {
        // Open non-audio URLs in new tab
        window.open(url, '_blank');
      }
    }
  };

  const renderIcon = (option, size = 'small') => {
    if (!option.icon && !option.url) return null;
    
    // Check if URL is an audio file
    const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
    const isAudioFile = option.url && audioExtensions.some(ext => option.url.toLowerCase().includes(ext));
    
    // Size configurations
    const sizeConfig = {
      small: { icon: 16, audio: 16, img: 'w-4 h-4' },
      large: { icon: 24, audio: 16, img: 'w-6 h-6' }
    };
    const config = sizeConfig[size];
    
    if (isAudioFile) {
      // Show audio control icons based on state
      let audioIcon;
      if (loadingAudioUrl === option.url) {
        audioIcon = <FaSpinner className="animate-spin" size={config.audio} />;
      } else if (playingAudioUrl === option.url) {
        audioIcon = <FaStop size={config.audio} color='red' />;
      } else {
        audioIcon = <FaPlay size={config.audio} color='green' />;
      }
      
      // Render based on display mode
      if (displayMode === 'card') {
        return (
          <div className="flex flex-col items-center">
            {/* Audio control icon (clickable) */}
            <div
              className="cursor-pointer hover:opacity-80 mb-1"
              onClick={(e) => handleIconClick(e, option.url)}
            >
              {audioIcon}
            </div>
            {/* Original icon (non-clickable) */}
            {option.icon && (
              <div>
                {typeof option.icon === 'string' ? (
                  <img
                    src={option.icon}
                    alt=""
                    className="w-4 h-4"
                  />
                ) : (
                  <Icon icon={option.icon} size={16} />
                )}
              </div>
            )}
          </div>
        );
      } else {
        // Dropdown mode - horizontal layout
        return (
          <div className="flex items-center mr-2">
            {/* Audio control icon (clickable) */}
            <div
              className="cursor-pointer hover:opacity-80"
              onClick={(e) => handleIconClick(e, option.url)}
            >
              {audioIcon}
            </div>
            {/* Original icon (non-clickable) */}
            {option.icon && (
              <div className="ml-1">
                {typeof option.icon === 'string' ? (
                  <img
                    src={option.icon}
                    alt=""
                    className={config.img}
                  />
                ) : (
                  <Icon icon={option.icon} size={config.icon} />
                )}
              </div>
            )}
          </div>
        );
      }
    }
    
    // Non-audio files: show original icon if available
    if (!option.icon) return null;
    
    if (typeof option.icon === 'string') {
      return (
        <img
          src={option.icon}
          alt=""
          className={`${config.img} cursor-pointer hover:opacity-80 ${displayMode === 'dropdown' ? 'mr-2' : ''}`}
          onClick={(e) => handleIconClick(e, option.url)}
        />
      );
    }
    
    return (
      <div
        className={`cursor-pointer hover:opacity-80 ${displayMode === 'dropdown' ? 'mr-2' : ''}`}
        onClick={(e) => handleIconClick(e, option.url)}
      >
        <Icon icon={option.icon} size={config.icon} />
      </div>
    );
  };

  useEffect(() => {
    if (displayMode === 'dropdown') {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [displayMode]);

  useEffect(() => {
    if (displayMode === 'dropdown' && isOpen && buttonRef.current) {
      const calculateDropdownPosition = () => {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownMaxHeight = 480; // 60 * 4 (15rem in pixels)
        const itemHeight = 40; // Approximate height per item
        const totalItemsHeight = (opts.length + 1) * itemHeight; // +1 for placeholder
        const actualDropdownHeight = Math.min(dropdownMaxHeight, totalItemsHeight);
        
        const spaceBelow = viewportHeight - buttonRect.bottom - 8; // 8px margin
        const spaceAbove = buttonRect.top - 8; // 8px margin
        
        let style = {
          width: buttonRect.width,
        };
        
        if (spaceBelow >= actualDropdownHeight) {
          // Position below
          style.top = '100%';
          style.bottom = 'auto';
          style.maxHeight = Math.min(actualDropdownHeight, spaceBelow);
        } else if (spaceAbove >= actualDropdownHeight) {
          // Position above
          style.bottom = '100%';
          style.top = 'auto';
          style.maxHeight = Math.min(actualDropdownHeight, spaceAbove);
        } else {
          // Use the side with more space
          if (spaceBelow > spaceAbove) {
            style.top = '100%';
            style.bottom = 'auto';
            style.maxHeight = spaceBelow;
          } else {
            style.bottom = '100%';
            style.top = 'auto';
            style.maxHeight = spaceAbove;
          }
        }
        
        setDropdownStyle(style);
      };
      
      calculateDropdownPosition();
      
      // Recalculate on window resize
      window.addEventListener('resize', calculateDropdownPosition);
      window.addEventListener('scroll', calculateDropdownPosition);
      
      return () => {
        window.removeEventListener('resize', calculateDropdownPosition);
        window.removeEventListener('scroll', calculateDropdownPosition);
      };
    }
  }, [displayMode, isOpen, opts.length]);

  // Render row mode
  if (displayMode === 'row') {
    return (
      <div className={className}>
        {label || (store && field) && (
          <div className="flex justify-between items-center mb-4">
              <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label || (store && field ? t(`${store.name}.${field}`) : 'Select')}
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
        )}
        
        {/* Row-based selection interface */}
        <div className="border border-gray-300 rounded-lg p-4 bg-white max-h-[492px] overflow-y-auto">
          {/* Placeholder/Clear option */}
          {(placeholder || (store && field)) && (
            <div
              className={`mb-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                !selectedValue ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onClick={() => handleSelect('')}
            >
              <div className="text-gray-500 text-sm">
                {placeholder ||
                (store && field ? t(`${store.name}.select${field[0].toUpperCase() + field.slice(1)}`) : 'Select an option')}
              </div>
            </div>
          )}
          
          {/* Options list */}
          <div className="space-y-2">
            {opts.map((option, i) => (
              <div
                key={`${i}-${option.value}`}
                className={`flex items-center p-3 border rounded cursor-pointer transition-all ${
                  selectedValue === option.value
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleSelect(option.value)}
              >
                {renderIcon(option, 'small')}
                <span className="text-gray-900">{option.label}</span>
              </div>
            ))}
          </div>
        </div>

        {uiStore.formSelectDialogOpen && AddDialogPage && (
          <Dialog
            isOpen={true}
            onClose={() => uiStore.closeFormSelectDialog()}
            onConfirm={async () => {
              if (uiStore.formSelectDialogData?.onAdd) {
                const newItem = await uiStore.formSelectDialogData.onAdd();
                if (newItem && onOptionsChange) {
                  const newOptions = [...opts, { value: newItem.value, label: newItem.label }];
                  onOptionsChange(newOptions);
                  handleSelect(newItem.value);
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
  }

  // Render card mode
  if (displayMode === 'card') {
    return (
      <div className={className}>
        {label || (store && field) && (
          <div className="flex justify-between items-center mb-4">
              <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                {label || (store && field ? t(`${store.name}.${field}`) : 'Select')}
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
        )}
        
        {/* Card-based selection interface */}
        <div className="border border-gray-300 rounded-lg p-4 bg-white max-h-[492px] overflow-y-auto">
          {/* Placeholder/Clear option */}
          {(placeholder || (store && field)) && (
            <div
              className={`mb-4 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer text-center transition-colors hover:bg-gray-50 ${
                !selectedValue ? 'bg-blue-50 border-blue-300' : ''
              }`}
              onClick={() => handleSelect('')}
            >
              <div className="text-gray-500 text-sm">
                {placeholder ||
                (store && field ? t(`${store.name}.select${field[0].toUpperCase() + field.slice(1)}`) : 'Select an option')}
              </div>
            </div>
          )}
          
          {/* Options grid */}
          <div className={`grid grid-cols-${cols} sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 items-stretch`}>
            {opts.map((option, i) => {
              // Check if this option has an audio URL
              const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
              const isAudioFile = option.url && audioExtensions.some(ext => option.url.toLowerCase().includes(ext));
              
              // Determine if this option has an icon to display
              const hasIcon = isAudioFile || option.icon;
              
              return (
                <div
                  key={`${i}-${option.value}`}
                  className={`flex flex-col items-center justify-center p-2 border rounded cursor-pointer transition-all w-full h-full min-h-[4rem] ${
                    selectedValue === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleSelect(option.value)}
                >
                  {isAudioFile ? (
                    // Audio file layout: icon that transforms to play button on hover
                    <div
                      onMouseEnter={() => setHoveredAudioUrl(option.url)}
                      onMouseLeave={() => setHoveredAudioUrl(null)}
                    >
                      {/* Main icon/play button on top - fixed height container */}
                      <div
                        className="flex justify-center items-center flex-shrink-0 cursor-pointer hover:opacity-80 h-8 w-8 mx-auto"
                        onClick={(e) => handleIconClick(e, option.url)}
                      >
                        {/* Show play controls if hovered, loading, playing, or no icon available */}
                        {(hoveredAudioUrl === option.url || loadingAudioUrl === option.url || playingAudioUrl === option.url || !option.icon) ? (
                          loadingAudioUrl === option.url ? (
                            <FaSpinner className="animate-spin" size={24} />
                          ) : playingAudioUrl === option.url ? (
                            <FaStop size={24} color='red' />
                          ) : (
                            <FaPlay size={24} color='green' />
                          )
                        ) : (
                          /* Show original icon when not hovered/playing and icon exists */
                          option.icon && (
                            typeof option.icon === 'string' ? (
                              <img
                                src={option.icon}
                                alt=""
                                className="w-8 h-8"
                              />
                            ) : (
                              <Icon icon={option.icon} size={32} />
                            )
                          )
                        )}
                      </div>
                      
                      {/* Text at bottom */}
                      <div className="text-xs text-center leading-tight break-words text-gray-700 overflow-hidden w-full">
                        {option.label}
                      </div>
                    </div>
                  ) : (
                    // Non-audio file layout: icon above, text below
                    <>
                      {/* Icon on top */}
                      <div className="mb-1 flex justify-center flex-shrink-0">
                        {renderIcon(option, 'large')}
                      </div>
                      
                      {/* Text at bottom */}
                      <div className="text-xs text-center leading-tight break-words text-gray-700 overflow-hidden w-full">
                        {option.label}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {uiStore.formSelectDialogOpen && AddDialogPage && (
          <Dialog
            isOpen={true}
            onClose={() => uiStore.closeFormSelectDialog()}
            onConfirm={async () => {
              if (uiStore.formSelectDialogData?.onAdd) {
                const newItem = await uiStore.formSelectDialogData.onAdd();
                if (newItem && onOptionsChange) {
                  const newOptions = [...opts, { value: newItem.value, label: newItem.label }];
                  onOptionsChange(newOptions);
                  handleSelect(newItem.value);
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
  }

  // Render dropdown mode (original)
  return (
    <div className={className}>
      {label || (store && field) && (
        <div className="flex justify-between items-center mb-2">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">
              {label || (store && field ? t(`${store.name}.${field}`) : 'Select')}
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
      )}
      
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 border rounded bg-white text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          required={required}
        >
          <div className="flex items-center">
            {selectedOption && showSelectedIcon && renderIcon(selectedOption, 'small')}
            <span className={selectedValue ? 'text-gray-900' : 'text-gray-500'}>
              {selectedOption ? selectedOption.label : (
                placeholder ||
                (store && field ? t(`${store.name}.select${field[0].toUpperCase() + field.slice(1)}`) : 'Select an option')
              )}
            </span>
          </div>
          <FaChevronDown className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} size={12} />
        </button>

        {isOpen && (
          <div
            className="absolute z-10 mt-1 bg-white border border-gray-300 rounded-md shadow-lg overflow-auto"
            style={dropdownStyle}
          >
            {placeholder || (store && field) && (
              <div
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-500"
                onClick={() => handleSelect('')}
              >
                {placeholder ||
                (store && field ? t(`${store.name}.select${field[0].toUpperCase() + field.slice(1)}`) : 'Select an option')}
              </div>
            )}
            {opts.map((option, i) => (
              <div
                key={`${i}-${option.value}`}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                onClick={() => handleSelect(option.value)}
              >
                {renderIcon(option, 'small')}
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {uiStore.formSelectDialogOpen && AddDialogPage && (
        <Dialog
          isOpen={true}
          onClose={() => uiStore.closeFormSelectDialog()}
          onConfirm={async () => {
            if (uiStore.formSelectDialogData?.onAdd) {
              const newItem = await uiStore.formSelectDialogData.onAdd();
              if (newItem && onOptionsChange) {
                const newOptions = [...opts, { value: newItem.value, label: newItem.label }];
                onOptionsChange(newOptions);
                handleSelect(newItem.value);
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