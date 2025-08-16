import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import ConfirmButtons from './ConfirmButtons';
import PageTitle from './PageTitle';
import { ErrorDialog } from './Dialogs';

const Page = observer(({ store, editItem, title, children }) => {
  useEffect(() => {
    store.initPageEditing && editItem && store.initPageEditing(editItem);
    return () => {
      store.exitPageEditing && store.exitPageEditing();
    };
  }, [store, editItem]);

  return (
    <div className="p-4 space-y-4">

      <PageTitle title={title || store.pageTitle} />

      {children}

      {editItem && (
        <ConfirmButtons
          isConfirm={true}
          onConfirm={() => store.confirmEdit()}
        />
      )}

      <ErrorDialog store={store} />

    </div>
  );
});

export default Page;