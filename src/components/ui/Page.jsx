import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import ConfirmButtons from './ConfirmButtons';
import PageTitle from './PageTitle';
import { ConfirmDialog, ErrorDialog, InfoDialog, ToggleConfirmDialog } from './Dialogs';
//import routeStore from '../../stores/routeStore';

const Page = observer(({ store, editItem, title, showDialogsOnly, onClose, onConfirm, children }) => {
  useEffect(() => {
    store.initPageEditing && editItem && store.initPageEditing(editItem);
    
    // Pass query parameters to store if it has a method to handle them
    // if (store.setQueryParams && typeof store.setQueryParams === 'function') {
    //   store.setQueryParams(routeStore.queryParamsObject);
    // }
    
    return () => {
      store.exitPageEditing && store.exitPageEditing();
    };
//  }, [store, editItem, routeStore.queryParamsObject]);
  }, [store, editItem]);

  return (
    <div className="p-4 space-y-4">

      {!showDialogsOnly && <PageTitle title={title || store.pageTitle} />}

      {children}

      {editItem && (
        <ConfirmButtons
          isConfirm={true}
          onConfirm={onConfirm || (() => store.confirmEdit())}
          onClose={onClose}
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