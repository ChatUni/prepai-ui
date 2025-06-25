import { makeAutoObservable, runInAction } from 'mobx';
import DEFAULT_AVATAR from '../assets/avatar.png';
import clientStore from './clientStore';
import lang from './languageStore';
import { get } from '../utils/db';
import seriesStore from './seriesStore';
import assistantStore from './assistantStore';
import membershipStore from './membershipStore';

class UserStore {
  user = {};
  examRecords = [];
  coupons = [];

  get name() {
    return this.user.name || lang.t('menu.account_page.guest');
  }

  get isLoggedIn() {
    return this.user.isLoggedIn;
  }

  get avatar() {
    return this.user.avatar || DEFAULT_AVATAR;
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

  constructor() {
    makeAutoObservable(this);
    this.checkSavedLoginState();  
  }

  async initData() {
    await clientStore.loadClient();
    await seriesStore.fetchSeries();
    await assistantStore.fetchItems();
    await membershipStore.fetchItems();
  }

  checkSavedLoginState() {
    try {
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

  saveLoginState() {
    try {
      localStorage.setItem('user', JSON.stringify(this.user));
    } catch (error) {
      console.error('Error saving login state:', error);
    }
  }

  setUser(info) {
    this.user = { ...this.user, ...info };
    this.saveLoginState();
  }

  async loginWithPhone(phoneNumber, verificationCode) {
    try {
      // Get user info from API using phone and client ID
      const users = await get('users', {
        phone: phoneNumber,
        clientId: clientStore.client.id
      });

      if (!users || users.length === 0) {
        throw new Error('User not found');
      }

      const user = users[0];
      
      runInAction(() => {
        this.user = {
          ...this.user,
          ...user,
          isLoggedIn: true,
          phoneNumber: phoneNumber
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

  login(credentials) {
    console.log('Login with credentials:', credentials);
    this.user.isLoggedIn = true
    this.saveLoginState();
    return Promise.resolve(this.user);
  }

  logout() {
    console.log('Logging out user');
    this.user.isLoggedIn = false
    this.saveLoginState();
    return Promise.resolve();
  }

  fetchExamRecords() {
    console.log('Fetching exam records');
    this.examRecords = []    
    return Promise.resolve(this.examRecords);
  }
  
  fetchCoupons() {
    console.log('Fetching coupons');
    this.coupons = []    
    return Promise.resolve(this.coupons);
  }

  isPaid(type, id) {
    return this.isAdmin || this.user.transactions.some(t => t.type === type && t.product_id === id);
  }
}

const userStore = new UserStore();
export default userStore;
