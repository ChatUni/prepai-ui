import { runInAction } from 'mobx';

class ListPageStore {
  searchQuery = '';
  items = [];

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

  setItems = function(items) {
    this.items = items;
  }
  
  reset = function() {
    this.searchQuery = '';
    this.items = [];
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

  gotoDetail = function(item, navigate) {
    if (!this.isAdminMode && this.detailRoute) {
      navigate(this.detailRoute.replace('{id}', item.id));
    }
  };
}

export default ListPageStore;