import { observer } from 'mobx-react-lite';
import Dialog from './Dialog';
import { t } from '../../stores/languageStore';

export const ErrorDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={store.error}
    onClose={() => store.closeErrorDialog()}
    title={t('common.error')}
  >
    {(Array.isArray(store.error) ? store.error : [store.error]).map((e, i) =>
      <div className="text-gray-700" key={i}>{e}</div>
    )}
  </Dialog>
));

export const ConfirmDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={!!store.confirmType}
    onClose={() => store.closeConfirmDialog()}
    onConfirm={() => store.confirm(store.confirmType)}
    title={t(`${store.name}.${store.confirmType}`)}
    isConfirm={true}
  >
    {store.confirmType && t(
      `${store.name}.confirm_${store.confirmType}`,
      { name: store.editingItem?.name || '' }
    )}
  </Dialog>
));

export const ToggleConfirmDialog = observer(({ store }) => {
  if (!store?.editingItem) return null;
  const val = store.editingItem[store.toggleConfirmField];
  const key = `${val ? 'not_' : ''}${store.toggleConfirmField}`;
  return (
    <Dialog
      isOpen={!!store.toggleConfirmField}
      onClose={() => store.closeToggleConfirmDialog()}
      onConfirm={() => store.confirmToggle(store.toggleConfirmField)}
      title={t(`${store.name}.${key}`)}
      isConfirm={true}
    >
      {t(
        `${store.name}.confirm_${key}`,
        { name: store.editingItem.name || store.editingItem.title || '' }
      )}
    </Dialog>
  );
});

export const InfoDialog = observer(({ store }) => store && (
  <Dialog
    isOpen={!!store.info}
    onClose={() => store.closeInfoDialog()}
  >
    {store.info}
  </Dialog>
));

export const EditDialog = observer(({ store, renderEdit, children, size = "md" }) => store &&
  <Dialog
    store={store}
    isOpen={store.showEditDialog}
    onClose={() => store.closeEditDialog()}
    onConfirm={() => store.confirmEdit()}
    title={t(`${store.name}.${store.isEditMode ? 'edit.title' : 'createNew'}`)}
    size={size}
    isConfirm={true}
    renderChildren={renderEdit}
  >
    {children}
  </Dialog>
);

export const GroupNameDialog = observer(({ store, isEdit }) => store && (
  <Dialog
    isOpen={isEdit ? store.isEditGroupDialogOpen : store.isAddGroupDialogOpen}
    onClose={() => isEdit ? store.closeEditGroupDialog() : store.closeAddGroupDialog()}
    onConfirm={() => isEdit ? store.handleEditGroup(store) : store.handleAddGroup(store)}
    title={t(`common.groups.${isEdit ? 'edit' : 'add'}Group`)}
    value={store.newGroupName}
    onChange={(value) => store.setNewGroupName(value)}
    placeholder={t(`common.groups.enterName`)}
    isConfirm={true}
  >
    <input
      type="text"
      value={store.newGroupName}
      onChange={(e) => store.setNewGroupName(e.target.value)}
      placeholder={t(`common.groups.enterName`)}
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
    title={t(`common.groups.delete`)}
    isConfirm={true}
  >
    <p>
      {t(`common.groups.confirmDelete`)}
    </p>
  </Dialog>
));
