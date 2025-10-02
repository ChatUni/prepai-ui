import { runInAction } from 'mobx';
import { get, save, remove } from '../utils/db';
import { combineStores } from '../utils/storeUtils';
import clientStore from './clientStore';
import { t } from './languageStore';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import GroupedListStore from './groupedListStore';
import userStore from './userStore';
import { TOS } from '../utils/const';
import membershipStore from './membershipStore';
import { omit, range } from '../utils/utils';

const models = ['DeepSeek', '豆包', '通义千问', 'Kimi', '百川', '智谱']
const resultTypes = ['text', 'image', 'video', 'audio']

class AssistantStore {
  avatars = [];
  loadingModels = false;

  get name() {
    return 'assistant';
  }

  get pageTitle() {
    return this.isUserAssistantRoute
      ? t('menu.account_page.my_assistants')
      : this.isSettingRoute
        ? t('menu.admin_page.manage_assistant')
        : t('menu.ai');
  }

  get detailRoute() {
    return `/assistants/{id}/chat`;
  }

  get searchableFields() {
    return ['name', 'greeting', 'prompt'];
  }

  get filteringFields() {
    return [
      item => this.isUserRoute ? this.isUserAssistant(item) : !this.isUserAssistant(item)
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
    if (this.isUserAssistantRoute) {
      item.user_id = userStore.user.id;
      item.type = 'user';
    } else if (userStore.isSuperAdmin) {
      item.type = 'platform'
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
      prompt: () => !this.isPlatformAssistant(),
      image: 1,
      model: () => !this.isPlatformAssistant(),
      group: 1,
    }
  }

  get modelOptions() {
    return models;
  }

  get resultOptions() {
    return resultTypes;
  }

  get imageCollections() {
    return this.avatars;
  }

  get isUserGroups() {
    return this.isUserAssistantRoute;
  }

  get canGotoDetail() {
    return this.isUserAssistantRoute;
  }

  init = async function() {
    await this.fetchAvatars();
  }

  fetchAvatars = async function() {
    const files = await get('tos_folder', { folder: 'assistants/avatars' });
    this.avatars = files.map(file => `${TOS}assistants/avatars/${file.fileName}`);
  }

  fetchItemList = async function() {
    const assistants = await get('assistants', { clientId: clientStore.client.id, userId: userStore.user.id })
    return assistants
      .filter(a => !userStore.isSuperAdmin || this.isPlatformAssistant(a))
      .map(a => {
        this.parseParams(a)
        const result = this.getResult(a);
        const memberType = membershipStore.getMemberType(result);
        return this.isPlatformAssistant(a)
          ? { ...a, memberType, usageType: result, ...this.getOverrideItem(a) }
          : { ...a, memberType, usageType: result, shelf: !this.isUserAssistant(a) }
      })
  };
  
  getOverrideItem = function(item) {
    return clientStore.client.settings.assistants.find(x => x.id === item.id)
  }

  parseParams = function(item) {
    if (item.param) {
      Object.keys(item.param).forEach((k, i) => {
        if (item.param[k] !== 1) {
          item[`p${i}_name`] = k
          item[`p${i}_type`] = item.param[k].type || ''
          item[`p${i}_options`] = item.param[k].options || ''
          item[`p${i}_mode`] = item.param[k].mode || ''
          item[`p${i}_default`] = item.param[k].default || ''
          item[`p${i}_title`] = item.param[k].title || ''
          item[`p${i}_cols`] = item.param[k].cols
        }
      })
    }
  }

  save = async function(item) {
    if (userStore.isSuperAdmin) {
      item.type = 'platform'
      if (item.workflow_id) {
        item.function = 'workflow'
        item.param = { input: 1 };
        range(1, 5).forEach(x => {
          if (item[`p${x}_name`]) {
            const p = {}
            if (item[`p${x}_type`]) p.type = item[`p${x}_type`]
            if (item[`p${x}_options`]) p.options = item[`p${x}_options`]
            if (item[`p${x}_mode`]) p.mode = item[`p${x}_mode`]
            if (item[`p${x}_default`]) p.default = item[`p${x}_default`]
            if (item[`p${x}_title`]) p.title = item[`p${x}_title`]
            if (item[`p${x}_cols`]) p.cols = +item[`p${x}_cols`]
            item.param[item[`p${x}_name`]] = p
          }
        })
      }
      return await save('assistants', this.omitParams(item));
    } else if (this.isPlatformAssistant(item)) {
      const pa = {
        id: item.id,
        type: item.type,
        name: item.name,
        desc: item.desc,
        greeting: item.greeting,
        group: item.group,
        image: item.image,
        hidden: item.hidden,
      }
      const o = this.getOverrideItem(pa)
      if (o) clientStore.client.settings.assistants.remove(o)
      clientStore.client.settings.assistants.push(pa)
      await clientStore.save()
      return item
    } else {
      item.client_id = clientStore.client.id;
      if (item.shelf) delete item.user_id;
      else item.user_id = userStore.user.id;
      item.type = item.shelf ? 'client' : 'user';
      return await save('assistants', item);
    }
  }

  omitParams = function(item) {
    return omit(item, [
      'memberType',
      'usageType',
      ...range(1, 5).map(x => [`p${x}_name`,`p${x}_type`,`p${x}_options`,`p${x}_mode`,`p${x}_default`,`p${x}_title`,`p${x}_cols`]).flat()
    ])
  }

  remove = async function(id) {
    await remove('assistants', id);
  }

  isPlatformAssistant = function(item = this.editingItem) {
    return item.type === 'platform';
  }

  isClientAssistant = function(item = this.editingItem) {
    return item.type === 'client';
  }

  isUserAssistant = function(item = this.editingItem) {
    return item.type === 'user';
  }

  getResult = function(item = this.editingItem) {
    let r = item.result || item.function || 'text';
    if (r.startsWith('<')) r = 'text';
    return r;
  }

  isText = function(item = this.editingItem) {
    return this.getResult(item) === 'text';
  }

  isImage = function(item = this.editingItem) {
    return this.getResult(item) === 'image';
  }

  isAudio = function(item = this.editingItem) {
    return this.getResult(item) === 'audio';
  }

  isVideo = function(item = this.editingItem) {
    return this.getResult(item) === 'video';
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
