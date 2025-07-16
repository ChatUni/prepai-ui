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

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      greeting: '',
      prompt: '',
      image: '',
      model: '',
      group: ''
    };
  }

  get validator() {
    return {
      name: 1,
      greeting: 1,
      prompt: 1,
      image: 1,
      model: 1,
    }
  }

  get requireMembership() {
    return true;
  }

  get isPlatformAssistant() {
    return this.editingItem.type === 1;
  }
  
  get modelOptions() {
    return this.models
      .map(model => ({
        value: model.id,
        label: model.name.replace(/\s*\(free\)$/, '')
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  initData = async function() {
    await this.fetchOpenRouterModels();
  }

  fetchItemList = async function() {
    const platform_assistants = [] // await get('platform_assistants');
    const client_assistants = await get('client_assistants', { clientId: clientStore.client.id });
    return [...(platform_assistants || []), ...(client_assistants || [])];
  };
  
  save = async function(item) {
    await save('assistants', item);
  }

  updateOpenRouterModels = async function() {
    this.loadingModels = true;
    
    try {
      const response = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }
      
      const result = await response.json();
      const models = result.data;
      await save('models', models);
    } catch (error) {
      console.error('Error updating OpenRouter models:', error);
    } finally {
      this.loadingModels = false;
    }
  }

  fetchOpenRouterModels = async function() {
    this.loadingModels = true;
    
    try {      
      await updateOpenRouterModels();
      const models = await get('models');

      runInAction(() => {
        // Filter for free models only
        this.models = models.filter(model => (model.name || '').endsWith('(free)') || (model.pricing?.prompt === '0' && model.pricing?.completion === '0'));
        this.loadingModels = false;
      });
    } catch (error) {
      runInAction(() => {
        this.loadingModels = false;
      });
      console.error('Error fetching OpenRouter models:', error);
    }
  }

 }

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, AssistantStore);