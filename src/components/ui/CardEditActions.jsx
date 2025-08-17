import React from 'react';
import { observer } from 'mobx-react-lite';
import { MdDragIndicator, MdRestoreFromTrash } from 'react-icons/md';
import { FiEyeOff, FiEye, FiEdit, FiTrash2, FiShare, FiDownload } from 'react-icons/fi';
import ActionButton from './ActionButton';
import { t } from '../../stores/languageStore';

const CardEditActions = observer(({
  store,
  item,
  hideEdit,
  hideDelete,
  hideRecycle = () => true,
  hideDrag,
  hideVisibility,
  hideShelf = () => true,
  hideShare = () => true,
  onTop = false,
}) => {
  const handleClick = (handler, field) => (e) => {
    e.stopPropagation();
    store[handler](item, field);
  };

  return (
    <div className={`absolute ${onTop ? 'top-2' : 'bottom-2'} right-2 flex gap-2 items-center bg-white/90 rounded-lg p-1`}>
      {(!hideVisibility || !hideVisibility(item)) && (
        <ActionButton
          onClick={handleClick('openToggleConfirmDialog', 'hidden')}
          color="blue"
          icon={item.hidden ? FiEyeOff : FiEye}
          title={t(`${store.name}.${item.hidden ? 'not_' : ''}hidden`)}
        />
      )}
      {(!hideShelf || !hideShelf(item)) && (
        <ActionButton
          onClick={handleClick('openToggleConfirmDialog', 'shelf')}
          color="orange"
          icon={item.shelf ? FiDownload : FiShare}
          title={t(`${store.name}.${item.shelf ? 'not_' : ''}shelf`)}
        />
      )}
      {(!hideEdit || !hideEdit(item)) && (
        <ActionButton
          onClick={handleClick('openEditDialog')}
          color="green"
          icon={FiEdit}
          title={t(`${store.name}.edit.editTitle`)}
        />
      )}
      {(!hideDelete || !hideDelete(item)) && (
        <ActionButton
          onClick={handleClick('openDeleteDialog')}
          color="red"
          icon={FiTrash2}
          title={t(`${store.name}.edit.delete`)}
        />
      )}
      {(!hideRecycle || !hideRecycle(item)) && (
        <ActionButton
          onClick={handleClick('openToggleConfirmDialog', 'deleted')}
          color={item.deleted ? 'green' : 'red'}
          icon={item.deleted ? MdRestoreFromTrash : FiTrash2}
          title={t(`${store.name}.${item.deleted ? 'not_' : ''}deleted`)}
        />
      )}
      {(!hideDrag || !hideDrag(item)) &&
        <MdDragIndicator className="text-gray-400 text-xl cursor-move" aria-label="Drag to reorder" />
      }
    </div>
  );
});

export default CardEditActions;
