import { makeAutoObservable } from 'mobx';
import clientStore from './clientStore';

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
  showDeleteDialog = false;
  membershipToDelete = null;
  isTypeDropdownOpen = false;

  constructor() {
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

  setShowDeleteDialog = (show) => {
    this.showDeleteDialog = show;
  };

  setMembershipToDelete = (membership) => {
    this.membershipToDelete = membership;
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

  getTypeLabel = (type) => `membership.types.${membershipTypes[type]}`;

  handleEdit = (membership) => {
    // TODO: Navigate to edit membership page
    console.log('Edit membership:', membership);
  };

  handleDelete = (membership) => {
    this.setMembershipToDelete(membership);
    this.setShowDeleteDialog(true);
  };

  confirmDelete = () => {
    if (this.membershipToDelete) {
      // TODO: Implement delete functionality
      console.log('Delete membership:', this.membershipToDelete);
      this.setShowDeleteDialog(false);
      this.setMembershipToDelete(null);
    }
  };

  closeDeleteDialog = () => {
    this.setShowDeleteDialog(false);
    this.setMembershipToDelete(null);
  };

  handleCreateNew = () => {
    // TODO: Navigate to create membership page
    console.log('Create new membership');
  };
}

const membershipStore = new MembershipStore();
export default membershipStore;