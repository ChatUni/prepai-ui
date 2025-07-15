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
  user = {};
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

  get mediaInfo() {
    return {
      avatar: x => `users/${x.id}/avatar.jpg`
    }
  }

  get isLoggedIn() {
    return this.user.isLoggedIn;
  }

  get isClientAdmin() {
    return this.user.role === 'admin';
  }

  get isSubAdmin() {
    return this.user.role === 'sub';
  }

  get isSuperAdmin() {
    return this.user.role === 'super';
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
    if (item.id == this.user.id) this.user = { ...item, ...user[0] };
    return user[0];
  }
  
  checkSavedLoginState = async function() {
    try {
      await clientStore.loadClient();
      const saveduser = localStorage.getItem('user');
      if (saveduser) {
        const parseduser = JSON.parse(saveduser);
        this.user = { ...this.user, ...parseduser };
        console.log('Restored login state:', this.user.isLoggedIn);
        this.initData();
      }
    } catch (error) {
      console.error('Error restoring login state:', error);
    }
  }

  saveLoginState = function() {
    try {
      localStorage.setItem('user', JSON.stringify(this.user));
    } catch (error) {
      console.error('Error saving login state:', error);
    }
  }

  setUser = function(info) {
    this.user = { ...this.user, ...info };
    this.saveLoginState();
  }

  loginWithPhone = async function(phone, verificationCode) {
    try {
      // Get user info from API using phone and client ID
      const users = await get('user', {
        phone: phone,
        clientId: clientStore.client.id
      });

      let user;

      if (!users || users.length === 0) {
        // User doesn't exist, create a new one
        const newUser = {
          id: `${clientStore.client.id}_${phone}_${Date.now()}`,
          phone: phone,
          client_id: clientStore.client.id,
          name: `用户${phone.slice(-4)}`, // Default name using last 4 digits
          role: 'user',
          avatar: '',
          createdAt: new Date().toISOString(),
          isActive: true
        };

        // Save the new user to database
        await save('users', newUser);
        user = newUser;
      } else {
        user = users[0];
      }
      
      runInAction(() => {
        this.user = {
          ...this.user,
          ...user,
          isLoggedIn: true,
          phone: phone
        };
        this.saveLoginState();
      });

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

  getExpireDate = function(type, id) {
    if (!this.user.orders) return null;
    
    const matchingOrder = this.user.orders.find(order =>
      order.client_id == clientStore.client.id &&
      order.product_id.startsWith(type) &&
      (!id || order.product_id.endsWith(`_${id}`)) &&
      order.status === 'PAID' &&
      order.expires
    );
    
    return matchingOrder ? new Date(matchingOrder.expires) : null;
  }

  isPaid = function(type, id) {
    if (this.isAdmin) return true;
    
    const expireDate = this.getExpireDate(type, id);
    if (!expireDate) return false;
    
    const now = new Date();
    return expireDate > now;
  }

  toggleRole = async function(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const updatedUser = { ...user, role: newRole };
    await this.save(updatedUser);
    this.fetchItems();
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, UserStore);
