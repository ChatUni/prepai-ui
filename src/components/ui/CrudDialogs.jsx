import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from './Dialog';
import languageStore from '../../stores/languageStore';

export const DeleteConfirmDialog = observer(({
  isOpen,
  onClose,
  onConfirm,
  item,
  itemType,
  nameField = 'name'
}) => {
  const { t } = languageStore;
  
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={t(`${itemType}.delete`)}
      isConfirm={true}
    >
      <p>
        {item && t(`${itemType}.confirmDelete`, { name: item?.[nameField] || '' })}
      </p>
    </Dialog>
  );
});

export const VisibilityConfirmDialog = observer(({
  isOpen,
  onClose,
  onConfirm,
  item,
  itemType,
  nameField = 'name'
}) => {
  const { t } = languageStore;
  
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={item?.hidden ? t(`${itemType}.show`) : t(`${itemType}.hide`)}
      isConfirm={true}
    >
      <p>
        {item?.hidden
          ? t(`${itemType}.confirmShow`, { name: item?.[nameField] || '' })
          : t(`${itemType}.confirmHide`, { name: item?.[nameField] || '' })}
      </p>
    </Dialog>
  );
});

export const EditDialog = observer(({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  size = "md"
}) => (
  <Dialog
    isOpen={isOpen}
    onClose={onClose}
    onConfirm={onConfirm}
    title={title}
    size={size}
    isConfirm={true}
  >
    {children}
  </Dialog>
));

export const GroupNameDialog = observer(({
  isOpen,
  onClose,
  onConfirm,
  title,
  value,
  onChange,
  placeholder
}) => {
  const { t } = languageStore;
  
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      isConfirm={true}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
    </Dialog>
  );
});

export const ErrorDialog = observer(({
  isOpen,
  onClose,
  message
}) => {
  const { t } = languageStore;
  
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('common.error')}
    >
      <p className="text-gray-700">{message}</p>
    </Dialog>
  );
});