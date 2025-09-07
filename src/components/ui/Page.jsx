import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import ConfirmButtons from './ConfirmButtons';
import PageTitle from './PageTitle';
import { ConfirmDialog, ErrorDialog, InfoDialog, ToggleConfirmDialog } from './Dialogs';

const Page = observer(({ store, editItem, title, showDialogsOnly, children }) => {
  useEffect(() => {
    store.initPageEditing && editItem && store.initPageEditing(editItem);
    return () => {
      store.exitPageEditing && store.exitPageEditing();
    };
  }, [store, editItem]);

  return (
    <div className="p-4 space-y-4">

      {!showDialogsOnly && <PageTitle title={title || store.pageTitle} />}

      {children}

      {editItem && (
        <ConfirmButtons
          isConfirm={true}
          onConfirm={() => store.confirmEdit()}
        />
      )}

      <ErrorDialog store={store} />
      <ConfirmDialog store={store} />
      <ToggleConfirmDialog store={store} />
      <InfoDialog store={store} />

    </div>
  );
});

export default Page;