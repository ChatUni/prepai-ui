import { get, save, remove } from '../utils/db';
import { combineStores } from '../utils/storeUtils';
import clientStore from './clientStore';
import { t } from './languageStore';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
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

  getExamQuestions = function(id) {
    const exam = this.items.find(item => item.id === +id);
    return (exam && exam.questions) || []
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, ExamStore);