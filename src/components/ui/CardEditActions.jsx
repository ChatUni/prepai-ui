import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator } from 'react-icons/md';
import ActionButton from './ActionButton';
import { t } from '../../stores/languageStore';

const CardEditActions = observer(({
  store,
  item,
  hideDelete,
}) => {
  const handleClick = (handler) => (e) => {
    e.stopPropagation();
    store[handler](item);
  };

  return (
    <div className="absolute bottom-2 right-2 flex gap-2 items-center bg-white/90 rounded-lg p-1">
      {item.deleted ? (
        <ActionButton
          onClick={handleDeleteClick}
          color="green"
          icon="MdRestoreFromTrash"
          title={t('common.restore')}
        />
      ) : (
        <>
          <ActionButton
            onClick={handleClick('openVisibilityDialog')}
            color="blue"
            icon={item.hidden ? 'FiEyeOff' : 'FiEye'}
            title={t(`series.${item.hidden ? 'show' : 'hide'}`)}
          />
          <ActionButton
            onClick={handleClick('openEditDialog')}
            color="green"
            icon="FiEdit"
            title={t('common.edit')}
          />
          {hideDelete && !hideDelete(item) && (
            <ActionButton
              onClick={handleClick('openDeleteDialog')}
              color="red"
              icon="FiTrash2"
              title={t('common.delete')}
            />
          )}
          <MdDragIndicator
            className="text-gray-400 text-xl cursor-move"
            aria-label="Drag to reorder"
          />
        </>
      )}
    </div>
  );
});

export default CardEditActions;