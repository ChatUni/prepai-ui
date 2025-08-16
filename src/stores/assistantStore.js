import { runInAction } from 'mobx';
import { get, save, remove } from '../utils/db';
import { uploadToCloudinary } from '../utils/cloudinaryHelper';
import { combineStores } from '../utils/storeUtils';
import clientStore from './clientStore';
import { t } from './languageStore';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import GroupedListStore from './groupedListStore';
import userStore from './userStore';

const models = ['DeepSeek', '豆包', '通义千问', 'Kimi', '百川', '智谱']

class AssistantStore {
  models = [];
  loadingModels = false;

  get name() {
    return 'assistant';
  }

  get pageTitle() {
    return this.isAdminMode ? t('menu.admin_page.manage_assistant') : t('menu.ai');
  }

  get detailRoute() {
    return `/assistants/{id}/chat`;
  }

  get searchableFields() {
    return ['name', 'greeting', 'prompt'];
  }

  get filteringFields() {
    return [
      item => this.isUserMode ? this.isUserAssistant(item) : !this.isUserAssistant(item)
    ];
  }

  get newItem() {
    const item = {
      name: '',
      greeting: '',
      prompt: '',
      image: '',
      model: '',
      group: ''
    };
    if (this.isUserAssistantMode) {
      item.user_id = userStore.user.id;
      item.type = 'user';
    } else {
      item.client_id = clientStore.client.id;
      item.type = 'client';
    }
    return item;
  }

  get mediaInfo() {
    return {
      image: x => `assistants/${x.id}/image.jpg`
    }
  }

  get validator() {
    return {
      name: 1,
      greeting: 1,
      //prompt: 1,
      image: 1,
      //model: 1,
    }
  }

  get requireMembership() {
    return true;
  }

  get modelOptions() {
    return models;
  }

  get imageCollections() {
    return [
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/01.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/02.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/03.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/04.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/05.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/06.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/07.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/08.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/09.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/10.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/11.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/12.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/13.jpg',
      'https://prepai-files.tos-cn-beijing.volces.com/assistants/avatars/14.jpg',
    ];
  }

  init = async function() {
    // await this.fetchOpenRouterModels();
  }

  fetchItemList = async function() {
    const assistants = await get('assistants', { clientId: clientStore.client.id, userId: userStore.user.id })
    return assistants.map(a => this.isPlatformAssistant(a) ? { ...a, ...this.getOverrideItem(a) } : a)
  };
  
  getOverrideItem = function(item) {
    return clientStore.client.settings.assistants.find(x => x.id === item.id)
  }

  save = async function(item) {
    if (this.isPlatformAssistant(item)) {
      const pa = { id: item.id, type: item.type, name: item.name, desc: item.desc, greeting: item.greeting, group: item.group, image: item.image }
      const o = this.getOverrideItem(pa)
      if (o) clientStore.client.settings.assistants.remove(o)
      clientStore.client.settings.assistants.push(pa)
      await clientStore.save()
      return item
    } else {
      return await save('assistants', item);
    }
  }

  remove = async function(id) {
    await remove('assistants', id);
  }

  isPlatformAssistant = function(item) {
    return (item || this.editingItem).type === 'platform';
  }

  isClientAssistant = function(item) {
    return (item || this.editingItem).type === 'client';
  }

  isUserAssistant = function(item) {
    return (item || this.editingItem).type === 'user';
  }
 }

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, AssistantStore);

  // updateOpenRouterModels = async function() {
  //   this.loadingModels = true;
    
  //   try {
  //     const response = await fetch('https://openrouter.ai/api/v1/models', {
  //       headers: {
  //         'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY}`
  //       }
  //     });
      
  //     if (!response.ok) {
  //       throw new Error(`Failed to fetch models: ${response.statusText}`);
  //     }
      
  //     const result = await response.json();
  //     const models = result.data;
  //     await save('models', models);
  //   } catch (error) {
  //     console.error('Error updating OpenRouter models:', error);
  //   } finally {
  //     this.loadingModels = false;
  //   }
  // }

  // fetchOpenRouterModels = async function() {
  //   this.loadingModels = true;
    
  //   try {      
  //     // await this.updateOpenRouterModels();
  //     const models = await get('models');

  //     runInAction(() => {
  //       // Filter for free models only
  //       this.models = models.filter(model => (model.name || '').endsWith('(free)') || (model.pricing?.prompt === '0' && model.pricing?.completion === '0'));
  //       this.loadingModels = false;
  //     });
  //   } catch (error) {
  //     runInAction(() => {
  //       this.loadingModels = false;
  //     });
  //     console.error('Error fetching OpenRouter models:', error);
  //   }
  // }
