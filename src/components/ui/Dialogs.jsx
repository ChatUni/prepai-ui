import React from 'react';
import { observer } from 'mobx-react-lite';
import Dialog from './Dialog';
import { t } from '../../stores/languageStore';

export const DeleteConfirmDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={store.showDeleteDialog}
    onClose={() => store.closeDeleteDialog()}
    onConfirm={() => store.confirmDelete()}
    title={t(`${store.name}.delete`)}
    isConfirm={true}
  >
    <p>
      {store.editingItem && t(`${store.name}.confirmDelete`, { name: store.editingItem.name || '' })}
    </p>
  </Dialog>
));

export const VisibilityConfirmDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={store.showVisibilityDialog}
    onClose={() => store.closeVisibilityDialog()}
    onConfirm={() => store.confirmToggleVisibility()}
    title={store.editingItem?.hidden ? t(`${store.name}.show`) : t(`${store.name}.hide`)}
    isConfirm={true}
  >
    <p>
      {store.editingItem && t(
        `${store.name}.confirm${(store.editingItem.hidden ? 'Show' : 'Hide')}`,
        { name: store.editingItem.name || '' }
      )}
    </p>
  </Dialog>
));

export const EditDialog = observer(({ store, children, size = "md" }) => store && (
  <Dialog
    isOpen={store.showEditDialog}
    onClose={() => store.closeEditDialog()}
    onConfirm={() => store.confirmEdit()}
    title={t(`${store.name}.${store.isEditMode ? 'edit' : 'createNew'}`)}
    size={size}
    isConfirm={true}
  >
    {children}
  </Dialog>
));

export const GroupNameDialog = observer(({ store, isEdit }) => store && (
  <Dialog
    isOpen={isEdit ? store.isEditGroupDialogOpen : store.isAddGroupDialogOpen}
    onClose={() => isEdit ? store.closeEditGroupDialog() : store.closeAddGroupDialog()}
    onConfirm={() => isEdit ? store.handleEditGroup(store) : store.handleAddGroup(store)}
    title={t(`${store.name}.groups.${isEdit ? 'edit' : 'add'}Group`)}
    value={store.newGroupName}
    onChange={(value) => store.setNewGroupName(value)}
    placeholder={t(`${store.name}.groups.enterName`)}
    isConfirm={true}
  >
    <input
      type="text"
      value={store.newGroupName}
      onChange={(e) => store.setNewGroupName(e.target.value)}
      placeholder={t(`${store.name}.groups.enterName`)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      autoFocus
    />
  </Dialog>
));

export const GroupDeleteDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={store.isDeleteGroupDialogOpen}
    onClose={() => store.closeDeleteGroupDialog()}
    onConfirm={() => store.handleDeleteGroup()}
    title={t(`${store.name}.groups.delete`)}
    isConfirm={true}
  >
    <p>
      {t(`${store.name}.groups.confirmDelete`)}
    </p>
  </Dialog>
));

export const ConfirmCancelEditDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={store.showCancelEditDialog}
    onClose={() => store.closeCancelEditDialog()}
    onConfirm={() => store.confirmCancelEdit()}
    title={t(`${store.name}.cancelEdit`)}
    isConfirm={true}
  >
    <p>
      {t(`${store.name}.confirmCancelEdit`)}
    </p>
  </Dialog>
));

export const ErrorDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={store.isErrorDialogOpen}
    onClose={() => store.closeErrorDialog()}
    title={t('common.error')}
  >
    <p className="text-gray-700">{store.error}</p>
  </Dialog>
));