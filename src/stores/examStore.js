import { get, save, remove } from '../utils/db';
import { combineStores } from '../utils/storeUtils';
import clientStore from './clientStore';
import { t } from './languageStore';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import GroupedListStore from './groupedListStore';
import { TOS } from '../utils/const.js';

class ExamStore {
  get name() {
    return 'exam';
  }

  get pageTitle() {
    return this.isSettingRoute ? t('menu.admin_page.exam_settings') : t('exam.title');
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
      image: `${TOS}common/exams/icon.jpg`,
      group: ''
    };
  }

  get mediaInfo() {
    return {
      image: x => `exams/${x.id}/image.jpg`,
      upload_file: async item => {
        if (item.upload_file && item.upload_file instanceof File) {
          try {
            const { extractExamFromFile } = await import('../utils/extractExam.js');
            const questions = await extractExamFromFile(item.upload_file);
            if (questions && questions.length > 0) {
              item.questions = questions;
            }
          } catch (error) {
            console.error('Error extracting exam content:', error);
          }
        }
        return `exams/${item.id}/questions.doc`
      }
    }
  }

  get validator() {
    return {
      name: 1,
      desc: 1,
      group: 1,
    }
  }

  get requireMembership() {
    return true;
  }

  fetchItemList = async function() {
    return await get('exams', { clientId: clientStore.client.id });
  };
  
  save = async function(item) {
    return await save('exams', item);
  }

  remove = async function(id) {
    await remove('exams', id);
  };

  getExamQuestions = function(id) {
    const exam = this.items.find(item => item.id === +id);
    return (exam && exam.questions) || []
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, ExamStore);
