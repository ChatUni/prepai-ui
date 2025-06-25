import { runInAction } from 'mobx';
import routeStore from './routeStore';

class ListPageStore {
  searchQuery = '';
  items = [];
  loading = false;
  error = null;

  get filteredItems() {
    let filtered = this.items;

    if (!this.isAdminMode) {
      filtered = filtered.filter(assistant => !assistant.hidden);
    }

    if (this.searchQuery && this.searchableFields) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item => this.searchableFields.some(field => (item[field] || '').toLowerCase().includes(query)));
    }

    return filtered;
  }

  get isAdminMode() {
    return routeStore.currentPath.endsWith('/settings');
  }

  setItems = function(items) {
    this.items = items;
  }
  
  reset = function() {
    this.items = [];
    this.loading = false;
    this.error = null;
  }

  setSearchQuery = function(query) {
    this.searchQuery = query;
  };

  fetchItems = async function() {
    this.loading = true;
    this.error = null;
    
    try {
      const items = await this.fetchItemList();
      runInAction(() => {
        this.items = items;
        this.loading = false;
      });
    } catch (error) {
      console.error('Error fetching items:', error);
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }

  openErrorDialog = function(error) {
    this.error = error;
    this.isErrorDialogOpen = true;
  };

  closeErrorDialog = function() {
    this.isErrorDialogOpen = false;
    this.error = '';
  };
}

export default ListPageStore;