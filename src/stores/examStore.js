import { runInAction } from 'mobx';
import { get, save, remove } from '../utils/db';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import { combineStores } from '../utils/storeUtils';
import clientStore from './clientStore';
import { t } from './languageStore';
import routeStore from './routeStore';
import EditingStore from './editingStore';
import ListPageStore from './listPageStore';
import GroupedListStore from './groupedListStore';

class ExamStore {
  get name() {
    return 'exam';
  }

  get pageTitle() {
    return this.isAdminMode ? t('menu.admin_page.exam_settings') : t('exam.title');
  }

  get detailRoute() {
    return `/exams/{id}`;
  }

  get searchableFields() {
    return ['name', 'desc'];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      desc: '',
      cover: '',
      group: ''
    };
  }

  fetchItemList = async function() {
    return await get('exams', { clientId: clientStore.client.id });
  };
  
  save = async function(item) {
    await save('exams', item);
  }
}

const listPageStore = new ListPageStore();
const groupedListStore = new GroupedListStore();
const editingStore = new EditingStore();
const examStore = new ExamStore();
export default combineStores(listPageStore, groupedListStore, editingStore, examStore);