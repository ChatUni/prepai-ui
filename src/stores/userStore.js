import clientStore from './clientStore';
import { t } from './languageStore';
import { get, save, post } from '../utils/db';
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
import { TOS } from '../utils/const';

class UserStore {
  user = {};
  examRecords = [];
  coupons = [];
  verificationDialog = {
    isOpen: false,
    type: '', // 'phone', 'email', or 'dual'
    contact: '',
    phone: '',
    email: '',
    error: '',
    isLoading: false
  };

  // Track pending changes for dual verification
  pendingChanges = {
    phone: null,
    email: null
  };

  get name() {
    return 'user';
  }
  
  get pageTitle() {
    return t('menu.admin_page.sub_admin_settings');
  }

  get searchableFields() {
    return ['name', 'id', 'phone', 'email'];
  }

  get newItem() {
    return {
      client_id: clientStore.client.id,
      name: '',
      phone: '',
      email: '',
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

  get hasFreeAccess() {
    return this.isClientAdmin || this.isSuperAdmin;
  }

  get validator() {
    return {
      name: 1,
      phone: async (value, allValues) => {
        if (value && value !== (this.user.phone || '')) {
          // Phone changed, check if user exists
          const userExists = await this.checkUserExists(value, null);
          if (userExists) {
            this.openErrorDialog(t('user.edit.phoneExists'));
            return false;
          }
          this.pendingChanges.phone = value;
          
          // Check if email is also being changed in the same save operation
          const emailValue = allValues?.email;
          const emailChanged = emailValue && emailValue !== (this.user.email || '');
          
          if (emailChanged) {
            // Both are changing, store email change and wait for email validator
            this.pendingChanges.email = emailValue;
            // Don't trigger verification yet, let email validator handle it
            return false;
          } else {
            // Only phone changed
            await this.handlePhoneVerification(value);
            return false;
          }
        } else {
          // Phone not changed, clear pending change
          this.pendingChanges.phone = null;
        }
        return true;
      },
      email: async (value, allValues) => {
        if (value && value !== (this.user.email || '')) {
          // Email changed, check if user exists
          const userExists = await this.checkUserExists(null, value);
          if (userExists) {
            this.openErrorDialog(t('user.edit.emailExists'));
            return false;
          }
          this.pendingChanges.email = value;
          
          // Check if phone is also being changed (either pending or in current values)
          const phoneValue = allValues?.phone;
          const phoneChanged = (phoneValue && phoneValue !== (this.user.phone || '')) || this.pendingChanges.phone !== null;
          
          if (phoneChanged) {
            // Both are changing, trigger dual verification
            const finalPhoneValue = this.pendingChanges.phone || phoneValue;
            await this.handleDualVerification(finalPhoneValue, value);
            return false;
          } else {
            // Only email changed
            await this.handleEmailVerification(value);
            return false;
          }
        } else {
          // Email not changed, clear pending change
          this.pendingChanges.email = null;
        }
        return true;
      }
    }
  }

  get isTrialUsed() {
    return this.getMembershipOrders().some(order => order.body.includes(t('membership.trial')));
  }

  init = async function() {
    await this.checkSavedLoginState();
  }

  initData = async function() {
    await clientStore.loadClient();
    await this.loadUser();
    await this.fetchItems?.();
    await instructorStore.fetchItems();
    await seriesStore.fetchItems();
    await assistantStore.fetchItems();
    await membershipStore.fetchItems();
    await examStore.fetchItems();
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
      const saveduser = localStorage.getItem('user');
      if (saveduser) {
        const parseduser = JSON.parse(saveduser);
        this.user = {...(this.user || {}), ...parseduser};
        if (this.user.isLoggedIn) {
          this.initData();
        }
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

  loadUser = async function(phone, email) {
    if (!phone && !email) {
      if (this.user.phone) phone = this.user.phone;
      if (this.user.email) email = this.user.email;
    }
    const cid = clientStore.client.id || +import.meta.env.VITE_CLIENT_ID;
    try {
      const queryParams = { clientId: cid, withOrders: true };
      if (phone) queryParams.phone = phone;
      if (email) queryParams.email = email;
      
      const user = await get('user', queryParams);
      if (user) this.user = {...user, isLoggedIn: true};
      return user;
    } catch {
      return null;
    }
  }

  loginWithPhone = async function(phone, verificationCode, savedUser) {
    try {
      let user = savedUser;
      if (!user) user = await this.loadUser(phone);

      if (!user) {
        const cid = clientStore.client.id || +import.meta.env.VITE_CLIENT_ID;
        // User doesn't exist, create a new one using server-side logic
        const newUserData = {
          phone: phone,
          client_id: cid,
          name: t('menu.account_page.guest'),
          role: 'user',
        };

        // Save the new user to database (server will generate ID)
        this.user = await post('new_user', {}, newUserData);
      }
      
      this.user.isLoggedIn = true;
      this.saveLoginState();
      this.initData();
      return this.user;
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  }

  loginWithEmail = async function(email, verificationCode, savedUser) {
    try {
      let user = savedUser;
      if (!user) user = await this.loadUser(null, email);

      if (!user) {
        const cid = clientStore.client.id || +import.meta.env.VITE_CLIENT_ID;
        // User doesn't exist, create a new one using server-side logic
        const newUserData = {
          email: email,
          client_id: cid,
          name: t('menu.account_page.guest'),
          role: 'user',
        };

        // Save the new user to database (server will generate ID)
        this.user = await post('new_user', {}, newUserData);
      }
      
      this.user.isLoggedIn = true;
      this.saveLoginState();
      this.initData();
      return this.user;
    } catch (error) {
      console.error('Error during email login:', error);
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
    return user.avatar || `${TOS}common/users/icon.png`;
  }

  isSeriesPaid = function(id) {
    return this.isPaid('series', id);
  }

  getOrdersByType = function(type) {
    if (!this.user?.orders) return [];
    return this.user.orders.filter(order =>
      order.client_id == clientStore.client.id &&
      order.type == type &&
      order.status.toLowerCase() === 'paid' &&
      order.expireDate
    );
  }

  getMembershipOrders = function() {
    return membershipStore.getMemberTypes().map(type => this.getOrdersByType(type)).flat();
  }

  getSeriesOrders = function() {
    return this.getOrdersByType('series');
  }

  getWithdrawOrders = function() {
    return this.getOrdersByType('withdraw');
  }

  getRechargeOrders = function() {
    return this.getOrdersByType('recharge');
  }

  getRemainingDays = function(type, id) {
    if (!this.user?.orders) return null;
    
    const matchingOrders = this.getOrdersByType(type).filter(order =>
      !id || order.product_id == id
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
    if (this.hasFreeAccess) return true;

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

  getUsage = function(type) {
    return this.user.usage[type] || {}
  }

  // Phone/Email verification methods for editing user profile
  checkUserExists = async function(phone, email) {
    const cid = clientStore.client.id || +import.meta.env.VITE_CLIENT_ID;
    try {
      const queryParams = { clientId: cid };
      if (phone) queryParams.phone = phone;
      if (email) queryParams.email = email;
      
      const user = await get('check_user', queryParams);
      return user && user.id !== this.user.id; // Return true if user exists and is not current user
    } catch {
      return false;
    }
  }

  sendPhoneVerification = async function(phone) {
    try {
      const response = await post('send_sms', {}, {
        host: window.location.hostname,
        phone: phone,
        countryCode: '+86'
      });
      return response;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  sendEmailVerification = async function(email) {
    try {
      const response = await post('send_email', {}, {
        host: window.location.hostname,
        email: email
      });
      return response;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  verifyPhoneCode = async function(phone, code) {
    try {
      const response = await post('verify_sms', {}, {
        host: window.location.hostname,
        phone: phone,
        code: code,
        countryCode: '+86'
      });
      return response;
    } catch (error) {
      console.error('Error verifying SMS:', error);
      throw error;
    }
  }

  verifyEmailCode = async function(email, code) {
    try {
      const response = await post('verify_email', {}, {
        host: window.location.hostname,
        email: email,
        code: code
      });
      return response;
    } catch (error) {
      console.error('Error verifying email:', error);
      throw error;
    }
  }

  // Verification handlers for validator pattern
  handlePhoneVerification = async function(phone) {
    try {
      const response = await this.sendPhoneVerification(phone);
      if (response.success) {
        this.showVerificationDialog('phone', phone);
      } else {
        this.openErrorDialog(response.error || '发送验证码失败');
      }
    } catch (error) {
      this.openErrorDialog('发送验证码失败');
    }
  }

  handleEmailVerification = async function(email) {
    try {
      const response = await this.sendEmailVerification(email);
      if (response.success) {
        this.showVerificationDialog('email', email);
      } else {
        this.openErrorDialog(response.error || '发送验证码失败');
      }
    } catch (error) {
      this.openErrorDialog('发送验证码失败');
    }
  }

  showVerificationDialog = function(type, contact, phone = '', email = '') {
    this.verificationDialog = {
      isOpen: true,
      type,
      contact,
      phone,
      email,
      error: '',
      isLoading: false
    };
  }

  // Handle dual verification (both phone and email changed)
  handleDualVerification = async function(phone, email) {
    try {
      // Send verification codes for both
      const phoneResponse = await this.sendPhoneVerification(phone);
      const emailResponse = await this.sendEmailVerification(email);

      if (phoneResponse.success && emailResponse.success) {
        this.showVerificationDialog('dual', '', phone, email);
      } else {
        const errors = [];
        if (!phoneResponse.success) errors.push(`手机: ${phoneResponse.error || '发送验证码失败'}`);
        if (!emailResponse.success) errors.push(`邮箱: ${emailResponse.error || '发送验证码失败'}`);
        this.openErrorDialog(errors.join(', '));
      }
    } catch (error) {
      this.openErrorDialog('发送验证码失败');
    }
  }

  handleVerifyCode = async function(phoneCode, emailCode) {
    this.verificationDialog.isLoading = true;
    this.verificationDialog.error = '';

    try {
      if (this.verificationDialog.type === 'dual') {
        // Handle dual verification
        const phoneResponse = await this.verifyPhoneCode(this.verificationDialog.phone, phoneCode);
        const emailResponse = await this.verifyEmailCode(this.verificationDialog.email, emailCode);

        if (phoneResponse.success && emailResponse.success) {
          // Both verifications successful, save user data
          const updatedUser = {
            ...this.user,
            phone: this.verificationDialog.phone,
            email: this.verificationDialog.email
          };
          
          await this.save(updatedUser);
          this.resetPendingChanges();
          this.verificationDialog.isOpen = false;
          this.closeEditDialog();
        } else {
          const errors = [];
          if (!phoneResponse.success) errors.push(`手机: ${phoneResponse.error || '验证失败'}`);
          if (!emailResponse.success) errors.push(`邮箱: ${emailResponse.error || '验证失败'}`);
          this.verificationDialog.error = errors.join(', ');
          this.verificationDialog.isLoading = false;
        }
      } else {
        // Handle single verification (backward compatibility)
        const code = phoneCode || emailCode;
        let response;
        if (this.verificationDialog.type === 'phone') {
          response = await this.verifyPhoneCode(this.verificationDialog.contact, code);
        } else {
          response = await this.verifyEmailCode(this.verificationDialog.contact, code);
        }

        if (response.success) {
          // Verification successful, save user data
          const updatedUser = {
            ...this.user,
            [this.verificationDialog.type]: this.verificationDialog.contact
          };
          
          await this.save(updatedUser);
          this.resetPendingChanges();
          this.verificationDialog.isOpen = false;
          this.closeEditDialog();
        } else {
          this.verificationDialog.error = response.error || t('user.edit.verificationFailed');
          this.verificationDialog.isLoading = false;
        }
      }
    } catch (error) {
      this.verificationDialog.error = t('user.edit.verificationFailed');
      this.verificationDialog.isLoading = false;
    }
  }

  resetPendingChanges = function() {
    this.pendingChanges = {
      phone: null,
      email: null
    };
  }

  handleResendCode = async function(resendType) {
    try {
      if (this.verificationDialog.type === 'dual') {
        if (resendType === 'phone') {
          // Resend only phone code
          const phoneResponse = await this.sendPhoneVerification(this.verificationDialog.phone);
          if (!phoneResponse.success) {
            this.verificationDialog.error = `手机: ${phoneResponse.error || '发送验证码失败'}`;
          }
        } else if (resendType === 'email') {
          // Resend only email code
          const emailResponse = await this.sendEmailVerification(this.verificationDialog.email);
          if (!emailResponse.success) {
            this.verificationDialog.error = `邮箱: ${emailResponse.error || '发送验证码失败'}`;
          }
        } else {
          // Resend both codes (fallback for backward compatibility)
          const phoneResponse = await this.sendPhoneVerification(this.verificationDialog.phone);
          const emailResponse = await this.sendEmailVerification(this.verificationDialog.email);

          if (!phoneResponse.success || !emailResponse.success) {
            const errors = [];
            if (!phoneResponse.success) errors.push(`手机: ${phoneResponse.error || '发送验证码失败'}`);
            if (!emailResponse.success) errors.push(`邮箱: ${emailResponse.error || '发送验证码失败'}`);
            this.verificationDialog.error = errors.join(', ');
          }
        }
      } else {
        // Single verification resend
        let response;
        if (this.verificationDialog.type === 'phone') {
          response = await this.sendPhoneVerification(this.verificationDialog.contact);
        } else {
          response = await this.sendEmailVerification(this.verificationDialog.contact);
        }

        if (!response.success) {
          this.verificationDialog.error = response.error || '发送验证码失败';
        }
      }
    } catch (error) {
      this.verificationDialog.error = '发送验证码失败';
    }
  }

  closeVerificationDialog = function() {
    this.verificationDialog.isOpen = false;
    this.resetPendingChanges();
  }
}

export default combineStores(PageStore, ListStore, GroupedListStore, EditingStore, UserStore);
