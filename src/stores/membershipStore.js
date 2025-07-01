import { makeAutoObservable } from 'mobx';
import clientStore from './clientStore';
import { get, remove, save } from '../utils/db';
import EditingStore from './editingStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { t } from './languageStore';
import GroupedListStore from './groupedListStore';

const membershipTypes = [
  "all",
  "monthly",
  "annually",
  "lifetime",
  "trial"
]

class MembershipStore {
  selectedType = '';
  isTypeDropdownOpen = false;

  get name() {
    return 'membership';
  }

  get pageTitle() {
    return this.isAdminMode ? t('membership.priceSettings.title') : t('membership.title');
  }

  get searchableFields() {
    return ['name', 'desc'];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      desc: '',
    };
  }

  get membershipTypes() {
    return membershipTypes.map(x => ({ value: x, label: `membership.types.${x}` }));
  }

  get editingType() {
    return membershipTypes[this.editingMembership.type];
  }

  setSelectedType = (type) => {
    this.selectedType = type;
  };

  setTypeDropdownOpen = (open) => {
    this.isTypeDropdownOpen = open;
  };

  getTypeLabel = function(type) {
    return `membership.types.${membershipTypes[type]}`
  };

  fetchItemList = async function() {
    return await get('memberships', { clientId: clientStore.client.id });
  };
  
  remove = async function(membershipId) {
    await remove('memberships', membershipId);
  };

  save = async function(item) {
    item.price = parseFloat(item.price) || 0;
    item.orig_price = parseFloat(item.orig_price) || 0;
    await save('memberships', item);
  };
}

// const listPageStore = new ListPageStore();
// const groupedListStore = new GroupedListStore();
// const editingStore = new EditingStore();
// const membershipStore = new MembershipStore();
// export default combineStores(listPageStore, groupedListStore, editingStore, membershipStore);
export default combineStores(ListStore, GroupedListStore, EditingStore, MembershipStore);

// Filter by type
// if (this.selectedType) {
//   filtered = filtered.filter(membership =>
//     this.selectedType === 'all' || membershipTypes[membership.type] === this.selectedType
//   );
// }
