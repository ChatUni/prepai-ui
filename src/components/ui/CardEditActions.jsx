import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator, MdRestoreFromTrash } from 'react-icons/md';
import { FiEyeOff, FiEye, FiEdit, FiTrash2 } from 'react-icons/fi';
import ActionButton from './ActionButton';
import { t } from '../../stores/languageStore';

const CardEditActions = observer(({
  store,
  item,
  hideDelete,
  hideDrag,
  hideVisibility,
  onTop = false,
}) => {
  const handleClick = (handler) => (e) => {
    e.stopPropagation();
    store[handler](item);
  };

  return (
    <div className={`absolute ${onTop ? 'top-2' : 'bottom-2'} right-2 flex gap-2 items-center bg-white/90 rounded-lg p-1`}>
      {item.deleted ? (
        <ActionButton
          onClick={handleClick('openRestoreDialog')}
          color="green"
          icon={MdRestoreFromTrash}
          title={t(`${store.name}.edit.restore`)}
        />
      ) : (
        <>
          {!hideVisibility &&
            <ActionButton
              onClick={handleClick('openVisibilityDialog')}
              color="blue"
              icon={item.hidden ? FiEyeOff : FiEye}
              title={t(`${store.name}.${item.hidden ? 'show' : 'hide'}`)}
            />
          }
          <ActionButton
            onClick={handleClick('openEditDialog')}
            color="green"
            icon={FiEdit}
            title={t(`${store.name}.edit.editTitle`)}
          />
          {(!hideDelete || !hideDelete(item)) && (
            <ActionButton
              onClick={handleClick('openDeleteDialog')}
              color="red"
              icon={FiTrash2}
              title={t(`${store.name}.edit.delete`)}
            />
          )}
          {!hideDrag &&
            <MdDragIndicator className="text-gray-400 text-xl cursor-move" aria-label="Drag to reorder" />
          }
        </>
      )}
    </div>
  );
});

export default CardEditActions;
