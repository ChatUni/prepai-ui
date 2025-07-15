import clientStore from './clientStore';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { get, save, remove } from '../utils/db';
import { uploadImage } from '../utils/uploadHelper';

class InstructorStore {
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

  get validator() {
    return {
      name: 1,
      image: 1,
    }
  }

  fetchItemList = async function() {
    return await get('instructors', { clientId: clientStore.client.id });
  };
  
  saveInstructor = async function(item) {
    return await save('instructors', item);
  }

  save = async function(item = this.editingItem || {}) {
    if (!item.id) {
      const data = await this.saveInstructor(item);
      item.id = data.id;
    }

    if (item.image instanceof File) {
      const url = await uploadImage(item.image, `instructors/${item.id}/image.mp4`);
      item.image = url;
    }

    await this.saveInstructor(item);
  }
}

export default combineStores(PageStore, ListStore, EditingStore, InstructorStore);