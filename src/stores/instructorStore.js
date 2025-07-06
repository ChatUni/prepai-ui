import clientStore from './clientStore';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { get, save, remove } from '../utils/db';

class InstructorsStore {
  get name() {
    return 'instructor';
  }

  get detailRoute() {
    return `/instructors/{id}/chat`;
  }

  get searchableFields() {
    return ['name', 'title', 'bio', 'expertise'];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      title: '',
      bio: '',
      expertise: '',
    };
  }

  fetchItemList = async function() {
    return await get('instructors', { clientId: clientStore.client.id });
  };
  
  save = async function(item) {
    await save('instructors', item);
  }
}

export default combineStores(PageStore, ListStore, EditingStore, InstructorsStore);