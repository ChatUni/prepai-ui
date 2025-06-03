import { makeAutoObservable, runInAction } from 'mobx';
import DEFAULT_AVATAR from '../assets/avatar.png';
import clientStore from './clientStore';
import { get } from '../utils/db';

class UserStore {
  // User info
  userInfo = {
    id: 53,
    username: '游客', // Guest
    avatar: DEFAULT_AVATAR, // Using default avatar from assets
    gender: 'male', // male/female
    vipExpiry: '2025-12-27 10:33:52',
    isLoggedIn: true, // Set to true for development testing
    role: 'user',
    phoneNumber: '13800138000'
  };

  // Exam records
  examRecords = [];
  
  // Coupons
  coupons = [];

  constructor() {
    makeAutoObservable(this);
    
    // Check for saved login state on initialization
    this.checkSavedLoginState();
  }

  // Check if user was previously logged in
  checkSavedLoginState() {
    try {
      const savedUserInfo = localStorage.getItem('userInfo');
      if (savedUserInfo) {
        const parsedUserInfo = JSON.parse(savedUserInfo);
        this.userInfo = { ...this.userInfo, ...parsedUserInfo };
        console.log('Restored login state:', this.userInfo.isLoggedIn);
      }
    } catch (error) {
      console.error('Error restoring login state:', error);
    }
  }

  // Save login state
  saveLoginState() {
    try {
      localStorage.setItem('userInfo', JSON.stringify(this.userInfo));
    } catch (error) {
      console.error('Error saving login state:', error);
    }
  }

  // Update user info
  setUserInfo(info) {
    this.userInfo = { ...this.userInfo, ...info };
    this.saveLoginState();
  }

  // Login with phone and verification code
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
        this.userInfo = {
          ...this.userInfo,
          ...user,
          isLoggedIn: true,
          phoneNumber: phoneNumber
        };
        this.saveLoginState();
      });

      return this.userInfo;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  }

  // Traditional login method
  login(credentials) {
    // In a real app, this would make an API call
    console.log('Login with credentials:', credentials);
    
    // Mock successful login
    this.userInfo = {
      ...this.userInfo,
      isLoggedIn: true
    };
    
    this.saveLoginState();
    return Promise.resolve(this.userInfo);
  }

  // Logout method
  logout() {
    // In a real app, this would make an API call
    console.log('Logging out user');
    
    // Reset user info
    this.userInfo = {
      ...this.userInfo,
      isLoggedIn: false
    };
    
    this.saveLoginState();
    return Promise.resolve();
  }

  // Get user exams
  fetchExamRecords() {
    // In a real app, this would make an API call
    console.log('Fetching exam records');
    
    // Mock data
    this.examRecords = [
      { id: 1, courseName: '量子力学基础', score: 85, date: '2025-03-01' },
      { id: 2, courseName: '高等数学', score: 92, date: '2025-02-15' }
    ];
    
    return Promise.resolve(this.examRecords);
  }
  
  // Get user coupons
  fetchCoupons() {
    // In a real app, this would make an API call
    console.log('Fetching coupons');
    
    // Mock data
    this.coupons = [
      { id: 1, name: '新用户优惠', discount: 20, validUntil: '2025-04-01' },
      { id: 2, name: '季度促销', discount: 15, validUntil: '2025-06-30' }
    ];
    
    return Promise.resolve(this.coupons);
  }
}

const userStore = new UserStore();
export default userStore;
