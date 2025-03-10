import { makeAutoObservable } from 'mobx';
import DEFAULT_AVATAR from '../assets/avatar.png';

class UserStore {
  // User info
  userInfo = {
    id: 53,
    username: '游客', // Guest
    avatar: DEFAULT_AVATAR, // Using default avatar from assets
    gender: 'male', // male/female
    vipExpiry: '2025-12-27 10:33:52',
    isLoggedIn: false, // Changed to false by default for auth protection
    role: 'user',
    phoneNumber: null
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
  loginWithPhone(phoneNumber, verificationCode) {
    // In a real app, this would verify the code with an API
    console.log('Logging in with phone:', phoneNumber, 'code:', verificationCode);
    
    // Mock successful login
    this.userInfo = {
      ...this.userInfo,
      isLoggedIn: true,
      phoneNumber: phoneNumber,
      username: phoneNumber.substring(0, 3) + '****' + phoneNumber.substring(7)
    };
    
    this.saveLoginState();
    return Promise.resolve(this.userInfo);
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
