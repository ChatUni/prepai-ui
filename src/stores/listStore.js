import { runInAction } from 'mobx';
import userStore from './userStore';
import paymentManagerStore from './paymentManagerStore';

class ListStore {
  searchQuery = '';
  items = [];

  get filteredItems() {
    let filtered = this.items;

    if (!this.isAdminMode) {
      filtered = filtered.filter(item => !item.hidden && !item.deleted);
    }

    if (this.searchQuery && this.searchableFields) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(item => this.searchableFields.some(field => (item[field] || '').toLowerCase().includes(query)));
    }

    (this.filteringFields || []).forEach(filter => {
      if (typeof filter === 'function') {
        filtered = filtered.filter(filter)
      } else {
        const selectedField = `selected${filter[0].toUpperCase()}${filter.slice(1)}`
        filtered = filtered.filter(item => !this[selectedField] || item[filter] == this[selectedField])
      }
    })
    
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

  fetchItems = async function(isReload) {
    this.loading = true;
    this.error = null;
    
    try {
      const items = await this.fetchItemList(isReload);
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
    if (!this.isAdminMode) {
      if (this.requireMembership && !userStore.isMember) {
        paymentManagerStore.setShowMembershipDialog(true);
        return;
      }
      
      // Check if this is a membership - show purchase dialog
      if (this.name === 'membership') {
        this.showMembershipPurchaseDialog(item);
        return;
      }
      
      // Default behavior - navigate to detail route
      if (this.detailRoute) {
        navigate(this.detailRoute.replace('{id}', item.id));
      }
    }
  };
}

export default ListStore;