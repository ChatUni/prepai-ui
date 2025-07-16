import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import ConfirmButtons from './ConfirmButtons';

const PageEditContainer = observer(({ store, item, children }) => {
  useEffect(() => {
    store.initPageEditing && store.initPageEditing(item);
    return () => {
      store.exitPageEditing && store.exitPageEditing();
    };
  }, [store, item]);

  return (
    <div className="space-y-4">
      <div className="p-6 space-y-4">
        {children}
      </div>
      <ConfirmButtons
        isConfirm={true}
        onConfirm={() => store.confirmEdit()}
      />
    </div>
  );
});

export default PageEditContainer;