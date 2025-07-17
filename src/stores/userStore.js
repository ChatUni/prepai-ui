import { makeAutoObservable, runInAction } from 'mobx';
import DEFAULT_AVATAR from '../assets/avatar.png';
import clientStore from './clientStore';
import { t } from './languageStore';
import { get, save } from '../utils/db';
import seriesStore from './seriesStore';
import assistantStore from './assistantStore';
import membershipStore from './membershipStore';
import examStore from './examStore';
import instructorStore from './instructorStore';
import EditingStore from './editingStore';
import PageStore from './pageStore';
import ListStore from './listStore';
import { combineStores } from '../utils/storeUtils';
import { omit } from '../utils/utils';
import GroupedListStore from './groupedListStore';

class UserStore {
  user = null;
  examRecords = [];
  coupons = [];

  get name() {
    return 'user';
  }
  
  get pageTitle() {
    return t('menu.admin_page.sub_admin_settings');
  }

  get searchableFields() {
    return ['name', 'id', 'phone'];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      phone: '',
      role: 'user'
    };
  }

  get filteringFields() {
    return [
      item => !!this.searchQuery,
      item => item.role === 'sub' || item.role === 'user',
    ];
  }

  get mediaInfo() {
    return {
      avatar: x => `users/${x.id}/avatar.jpg`
    }
  }

  get isLoggedIn() {
    return this.user?.isLoggedIn;
  }

  get isClientAdmin() {
    return this.user?.role === 'admin';
  }

  get isSubAdmin() {
    return this.user?.role === 'sub';
  }

  get isSuperAdmin() {
    return this.user?.role === 'super';
  }

  get isAdmin() {
    return this.isClientAdmin || this.isSubAdmin || this.isSuperAdmin;
  }

  get isMember() {
    return this.isPaid('membership');
  }

  constructor() {
    this.checkSavedLoginState();  
  }

  initData = async function() {
    if (clientStore.client?.id) {
      await this.fetchItems?.();
      await instructorStore.fetchItems();
      await seriesStore.fetchItems();
      await assistantStore.fetchItems();
      await membershipStore.fetchItems();
      await examStore.fetchItems();
    }
  }

  fetchItemList = async function() {
    return await get('users', { clientId: clientStore.client.id });
  };
  
  save = async function(item) {
    const user = await save('users', omit(item, ['orders', 'isLoggedIn']));
    if (item.id == this.user?.id) {
      this.user = {...item, ...user[0]};
    }
    return user[0];
  }
  
  checkSavedLoginState = async function() {
    try {
      await clientStore.loadClient();
      const saveduser = localStorage.getItem('user');
      if (saveduser) {
        const parseduser = JSON.parse(saveduser);
        this.user = {...(this.user || {}), ...parseduser};
        const user = this.user;
        console.log('Restored login state:', user.isLoggedIn);
        await this.loginWithPhone(user.phone, '', parseduser);
      }
    } catch (error) {
      console.error('Error restoring login state:', error);
    }
  }

  saveLoginState = function() {
    try {
      localStorage.setItem('user', JSON.stringify(omit(this.user, ['orders'])));
    } catch (error) {
      console.error('Error saving login state:', error);
    }
  }

  setUser = function(info) {
    Object.keys(info).forEach(key => {
      this.user[key] = info[key];
    });
    this.saveLoginState();
  }

  loadUser = async function(phone) {
    if (!phone && this.user.phone) phone = this.user.phone;
    const users = await get('user', { phone, clientId: clientStore.client.id });
    const user = users && users.length > 0 ? users[0] : null;
    this.user = user;
    return user;
  }

  loginWithPhone = async function(phone, verificationCode, savedUser) {
    try {
      let user = savedUser;
      if (!user) user = await this.loadUser(phone);

      if (!user) {
        // User doesn't exist, create a new one
        const newUser = {
          id: `${clientStore.client.id}_${phone}`,
          phone: phone,
          client_id: clientStore.client.id,
          name: `用户${phone.slice(-4)}`, // Default name using last 4 digits
          role: 'user',
          avatar: '',
          date_created: new Date().toISOString(),
          isActive: true
        };

        // Save the new user to database
        await save('users', newUser);
        this.user = newUser;
      }
      
      this.user.isLoggedIn = true;
      this.initData();
      return this.user;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  login = function(credentials) {
    console.log('Login with credentials:', credentials);
    this.user.isLoggedIn = true
    this.saveLoginState();
    return Promise.resolve(this.user);
  }

  logout = function() {
    console.log('Logging out user');
    this.user.isLoggedIn = false
    this.saveLoginState();
    return Promise.resolve();
  }

  fetchExamRecords = function() {
    console.log('Fetching exam records');
    this.examRecords = []    
    return Promise.resolve(this.examRecords);
  }
  
  fetchCoupons = function() {
    console.log('Fetching coupons');
    this.coupons = []    
    return Promise.resolve(this.coupons);
  }

  getUserName = function(user = this.user) {
    return user.name || t('menu.account_page.guest');
  }

  getAvatar = function(user = this.user) {
    return user.avatar || DEFAULT_AVATAR;
  }

  isSeriesPaid = function(id) {
    return this.isPaid('series', id);
  }

  getRemainingDays = function(type, id) {
    if (!this.user?.orders) return null;
    
    const matchingOrders = this.user.orders.filter(order =>
      order.client_id == clientStore.client.id &&
      order.product_id.startsWith(type) &&
      (!id || order.product_id.endsWith(`_${id}`)) &&
      order.status === 'PAID' &&
      order.expireDate
    );
    
    if (matchingOrders.length === 0) return null;
    
    const now = new Date();
    let totalRemainingDays = 0;
    
    // Sum up all remaining days from all matching orders
    matchingOrders.forEach(order => {
      const expireDate = new Date(order.expireDate);
      const timeDiff = expireDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (daysDiff > 0) {
        totalRemainingDays += daysDiff;
      }
    });
    
    return totalRemainingDays > 0 ? totalRemainingDays : 0;
  }

  getExpireDate = function(type, id) {
    const remainingDays = this.getRemainingDays(type, id);
    if (!remainingDays) return null;
    
    // Return a date that is today + total remaining days
    const combinedExpireDate = new Date();
    combinedExpireDate.setDate(combinedExpireDate.getDate() + remainingDays);
    
    return combinedExpireDate;
  }

  isPaid = function(type, id) {
    if (this.isAdmin) return true;
    
    const expireDate = this.getExpireDate(type, id);
    if (!expireDate) return false;
    
    const now = new Date();
    return expireDate > now;
  }

  toggleRole = async function(user) {
    const newRole = user.role === 'sub' ? 'user' : 'sub';
    const updatedUser = { ...user, role: newRole };
    await this.save(updatedUser);
    this.fetchItems();
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, UserStore);
