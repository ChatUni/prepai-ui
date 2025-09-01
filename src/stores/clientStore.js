import { makeAutoObservable, runInAction } from 'mobx';
import { uploadImage } from '../utils/uploadHelper';
import { deleteImage, extractKeyFromUrl } from '../utils/tosHelper';
import { uploadToTOS } from '../utils/tosHelper';
import lang from './languageStore';
import { get, save } from '../utils/db';
import { omit } from '../utils/utils';
import { combineStores } from '../utils/storeUtils';
import PageStore from './pageStore';
import EditingStore from './editingStore';

class ClientStore {
  client = {};
  previewUrls = [];
  originalBanners = [];
  // Track changes as {type: 'add'|'edit'|'delete', data: File|string, index?: number, oldUrl?: string}
  changes = [];

  get name() {
    return 'client';
  }

  get newItem() {
    return {
      name: '',
      desc: '',
      logo: '',
      phone: '',
      email: '',
      qrcode: '',
    };
  }

  get mediaInfo() {
    return {
      logo: x => `logo.jpg`,
      qrcode: x => `qrcode.jpg`
    }
  }

  get validator() {
    return {
      name: 1,
    }
  }

  // get editingItem() {
  //   return this.client;
  // }

  get balance() {
    return this.client.latestOrder?.balance || 0;
  }

  get hasEmptyBanners() {
    return this.client.settings.banners.some((banner, index) => {
      // If banner URL is empty, check if there's a file selected for upload
      if (banner === '') {
        // Check if there's a preview URL (indicating a file is selected)
        return !this.previewUrls[index];
      }
      return false;
    });
  }

  get hasUnsavedChanges() {
    // Check if arrays have different lengths
    if (this.client.settings.banners.length !== this.originalBanners.length) {
      return true;
    }

    // Check if any banners are different
    const hasChangedBanners = this.client.settings.banners.some(
      (banner, index) => banner !== this.originalBanners[index]
    );

    // Return true if there are any changes
    return hasChangedBanners || this.changes.length > 0;
  }


  // setEditingField(field, value) {
  //   this.client[field] = value;
  // }

  startEditing = function() {
    this.originalBanners = [...this.client.settings.banners];
    this.changes = [];
  }

  cancelEditing = function() {
    this.client.settings.banners = [...this.originalBanners];
    this.previewUrls = [...this.originalBanners];
    this.changes = [];
  }

  saveChanges = async function(type = 'banners') {
    this.loading = true;
    this.error = null;

    try {
      if (type === 'banners') {
        const folder = `${this.client.id}/banners`;

        // Process changes in order
        for (const change of this.changes) {
          if (change.type === 'add') {
            const url = await uploadImage(change.data, `banners/${change.data.name}`);
            const index = this.client.settings.banners.indexOf('');
            if (index > -1) {
              this.client.settings.banners[index] = url;
            }
          } else if (change.type === 'edit') {
            // For edit: delete old image and upload new one
            if (change.oldUrl && change.oldUrl !== '') {
              try {
                const oldKey = extractKeyFromUrl(change.oldUrl);
                await deleteImage(oldKey);
              } catch (error) {
                console.warn('Failed to delete old image:', error);
                // Continue with upload even if delete fails
              }
            }
            
            // Upload new image
            const url = await uploadImage(change.data, `banners/${change.data.name}`);
            if (change.index !== undefined) {
              this.client.settings.banners[change.index] = url;
            }
          } else if (change.type === 'delete') {
            // Extract key from the URL for TOS deletion
            try {
              const key = extractKeyFromUrl(change.data);
              await deleteImage(key);
            } catch (error) {
              console.warn('Failed to delete image:', error);
              // Continue even if delete fails (image might already be deleted)
            }
          }
        }
      }

      // Save client object
      const response = await this.save(this.client);

      runInAction(() => {
        if (type === 'banners') {
          this.originalBanners = [...this.client.settings.banners];
          this.changes = [];
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
        this.openErrorDialog();
      });
    }
  }

  save = async function(item = this.client) {
    const r = await save('clients', omit(item, ['memberships', 'latestOrder', 'latestWithdraw']));
    this.loadClient();
    return r;
  }

  // save = async () => {
  //   this.loading = true;
  //   this.error = null;

  //   try {
  //     // Handle logo upload if there's a file selected
  //     if (this.client.logo instanceof File) {
  //       const logoKey = `clients/${this.client.id}/logo.png`;
  //       const logoUrl = await uploadToTOS(this.client.logo, logoKey);
        
  //       runInAction(() => {
  //         this.client.logo = logoUrl;
  //       });
  //     }

  //     // Save client data to database
  //     const response = await save('clients', omit(this.client, ['_id', 'memberships', 'assistants']));
      
  //     runInAction(() => {
  //       this.loading = false;
  //     });
      
  //     return response;
  //   } catch (error) {
  //     runInAction(() => {
  //       this.error = error.message;
  //       this.loading = false;
  //       this.openErrorDialog();
  //     });
  //     throw error;
  //   }
  // };

  deleteBanner = function(index) {
    const url = this.client.settings.banners[index];
    if (url && url !== '') {
      this.changes.push({ type: 'delete', data: url });
    }
    this.client.settings.banners.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  addBanner = function() {
    this.client.settings.banners.push('');
    this.previewUrls.push('');
  }

  setPreviewUrl = function(index, file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      runInAction(() => {
        this.previewUrls[index] = reader.result;
      });
    };
    reader.readAsDataURL(file);
  }

  handleImageSelect = function(file, index) {
    this.setPreviewUrl(index, file);
    
    // Check if we're editing an existing banner or adding a new one
    const currentUrl = this.client.settings.banners[index];
    if (currentUrl && currentUrl !== '') {
      // This is an edit - we need to delete the old image and upload the new one
      this.changes.push({
        type: 'edit',
        data: file,
        index,
        oldUrl: currentUrl
      });
    } else {
      // This is a new banner
      this.changes.push({ type: 'add', data: file, index });
    }
  }

  loadClient = async function() {
    this.loading = true;
    this.error = null;

    try {
      const client = await get('client', { id: import.meta.env.VITE_CLIENT_ID });
      
      runInAction(() => {
        if (client) {
          this.client = client;
          // Sort memberships by order field if they exist
          if (this.client.memberships && Array.isArray(this.client.memberships)) {
            this.client.memberships.sort((a, b) => a.order - b.order);
          }
        } else {
          // Initialize with newItem structure if no client found
          this.client = { ...this.newItem };
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
        this.openErrorDialog();
      });
    }
  }

  get isLoading() {
    return this.loading;
  }

  get hasError() {
    return !!this.error;
  }

  get formattedError() {
    if (!this.error) return '';

    console.log(this.error);
    
    // Handle specific error cases
    if (this.error === lang.t('series.banners.emptyBannersError')) {
      return lang.t('series.banners.emptyBannersError');
    }
    if (this.error.includes('Failed to save changes')) {
      return lang.t('series.banners.saveError');
    }
    if (this.error.includes('Failed to load client')) {
      return lang.t('series.banners.loadError');
    }

    // Default error message
    return lang.t('common.unexpectedError');
  }
}

export default combineStores(PageStore, EditingStore, ClientStore);