import { useEffect, useRef } from 'react';

/**
 * Hook that handles click outside of specified refs
 * @param {Function} onClickOutside - Callback to execute when clicked outside
 * @param {number} [refCount=1] - Number of refs to create
 * @returns {Array} Array of refs to attach to elements
 */
const useClickOutside = (onClickOutside, refCount = 1) => {
  const refs = Array(refCount).fill(null).map(() => useRef(null));

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutside = refs.every(ref => 
        ref.current && !ref.current.contains(event.target)
      );

      if (clickedOutside) {
        onClickOutside();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClickOutside]);

  return refs;
};

export default useClickOutside;