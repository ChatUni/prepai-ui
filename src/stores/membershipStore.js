import { makeAutoObservable } from 'mobx';
import clientStore from './clientStore';
import { remove, save } from '../utils/db';
import { createBaseCardStoreMethods } from '../utils/baseCardStoreUtils';

const membershipTypes = [
  "all",
  "monthly",
  "annually",
  "lifetime",
  "trial"
]

class MembershipStore {
  searchKeyword = '';
  selectedType = '';
  isTypeDropdownOpen = false;
  editingMembership = {};
  isEditMode = false;
  
  // Explicit properties to avoid conflicts
  currentItem = null;
  membershipToDelete = null;

  constructor() {
    // Mix in base card store methods
    Object.assign(this, createBaseCardStoreMethods());
    
    makeAutoObservable(this);
  }

  setSearchKeyword = (keyword) => {
    this.searchKeyword = keyword;
  };

  setSelectedType = (type) => {
    this.selectedType = type;
  };

  setTypeDropdownOpen = (open) => {
    this.isTypeDropdownOpen = open;
  };

  // Keep these for backward compatibility, but they now delegate to base methods
  setShowDeleteDialog = (show) => {
    this.showDeleteDialog = show;
  };

  setMembershipToDelete = (membership) => {
    this.membershipToDelete = membership;
    this.itemToDelete = membership;
    this.currentItem = membership;
  };

  setShowEditDialog = (show) => {
    this.showEditDialog = show;
  };

  setEditingMembership = (membership) => {
    this.editingMembership = { ...membership };
  };

  setIsEditMode = (isEdit) => {
    this.isEditMode = isEdit;
  };

  setEditingMembershipName = (name) => {
    this.editingMembership.name = name;
  };

  setEditingMembershipType = (type) => {
    this.editingMembership.type = membershipTypes.indexOf(type);
  };

  setEditingMembershipPrice = (price) => {
    this.editingMembership.price = price;
  };

  setEditingMembershipOriginalPrice = (originalPrice) => {
    this.editingMembership.orig_price = originalPrice;
  };

  setEditingMembershipDescription = (description) => {
    this.editingMembership.desc = description;
  };

  get memberships() {
    return clientStore.client.memberships || [];
  }

  get filteredMemberships() {
    let filtered = this.memberships;

    // Filter by search keyword
    if (this.searchKeyword) {
      const keyword = this.searchKeyword.toLowerCase();
      filtered = filtered.filter(membership =>
        membership.name?.toLowerCase().includes(keyword)
      );
    }

    // Filter by type
    if (this.selectedType) {
      filtered = filtered.filter(membership =>
        this.selectedType === 'all' || membershipTypes[membership.type] === this.selectedType
      );
    }

    return filtered;
  }

  get membershipTypes() {
    return membershipTypes.map(x => ({ value: x, label: `membership.types.${x}` }));
  }

  get editingType() {
    return membershipTypes[this.editingMembership.type];
  }

  getTypeLabel = (type) => `membership.types.${membershipTypes[type]}`;

  // Override base handlers to use membership-specific logic
  handleEdit = (membership) => {
    this.openEditDialog(membership);
  };

  handleDelete = (membership) => {
    this.openDeleteDialog(membership);
  };

  // Override base openEditDialog to handle membership-specific state
  openEditDialog = (membership) => {
    this.currentItem = membership;
    this.showEditDialog = true;
    this.setEditingMembership(membership);
    this.setIsEditMode(true);
  };

  // Override base openDeleteDialog to handle membership-specific state
  openDeleteDialog = (membership) => {
    this.currentItem = membership;
    this.itemToDelete = membership;
    this.membershipToDelete = membership;
    this.showDeleteDialog = true;
  };

  // Override base implementation with membership-specific logic
  confirmDelete = async () => {
    try {
      if (this.membershipToDelete) {
        await remove('memberships', this.membershipToDelete.id);
        await clientStore.loadClient();
        this.closeDeleteDialog();
      }
    } catch (error) {
      console.error('Error deleting membership:', error);
    }
  };

  // Override base closeDeleteDialog to handle membership-specific state
  closeDeleteDialog = () => {
    this.showDeleteDialog = false;
    this.membershipToDelete = null;
    this.itemToDelete = null;
    this.currentItem = null;
  };

  handleCreateNew = () => {
    this.setEditingMembership({
      client_id: clientStore.client.id,
      name: '',
      type: '',
      price: '',
      orig_price: '',
      desc: ''
    });
    this.setIsEditMode(false);
    this.setShowEditDialog(true);
  };

  // Override base closeEditDialog to handle membership-specific state
  closeEditDialog = () => {
    this.showEditDialog = false;
    this.currentItem = null;
    this.setEditingMembership({});
    this.setIsEditMode(false);
  };

  // Provide saveItem method for BaseCard compatibility
  saveItem = () => {
    return this.saveMembership();
  };

  saveMembership = async () => {
    try {
      const membership = { ...this.editingMembership };
      
      // Convert price fields to numbers
      membership.price = parseFloat(membership.price) || 0;
      membership.orig_price = parseFloat(membership.orig_price) || 0;

      // Save to database
      await save('memberships', membership);
      await clientStore.loadClient();
      this.closeEditDialog();
    } catch (error) {
      console.error('Error saving membership:', error);
    }
  };

  moveMembership = (fromIndex, toIndex) => {
    // Get the items being moved
    const fromItem = this.filteredMemberships[fromIndex];
    const toItem = this.filteredMemberships[toIndex];
    
    if (!fromItem || !toItem) return;
    
    // Update the order in the original memberships array
    const allMemberships = [...this.memberships];
    const fromOriginalIndex = allMemberships.findIndex(m => m.id === fromItem.id);
    const toOriginalIndex = allMemberships.findIndex(m => m.id === toItem.id);
    
    if (fromOriginalIndex !== -1 && toOriginalIndex !== -1) {
      const [originalMovedItem] = allMemberships.splice(fromOriginalIndex, 1);
      allMemberships.splice(toOriginalIndex, 0, originalMovedItem);
      
      // Update the client's memberships array
      clientStore.client.memberships = allMemberships;
    }
  };

  saveMembershipOrder = async () => {
    try {
      const membershipsWithOrder = this.memberships.map((membership, index) => ({
        ...membership,
        order: index
      }));
      
      await save('memberships', membershipsWithOrder);
      await clientStore.loadClient();
    } catch (error) {
      console.error('Error saving membership order:', error);
    }
  };
}

const membershipStore = new MembershipStore();
export default membershipStore;