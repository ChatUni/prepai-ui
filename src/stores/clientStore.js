import { makeAutoObservable, runInAction } from 'mobx';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryHelper';
import { uploadToTOS } from '../utils/tosHelper';
import lang from './languageStore';
import { get, save } from '../utils/db';
import { omit } from 'lodash';
import { combineStores } from '../utils/storeUtils';
import PageStore from './pageStore';
import EditingStore from './editingStore';

class ClientStore {
  client = {};
  loading = false;
  error = null;
  isErrorDialogOpen = false;
  isConfirmDialogOpen = false;
  previewUrls = [];
  originalBanners = [];
  // Track changes as {type: 'add'|'delete', data: File|string}
  changes = [];

  get name() {
    return 'client';
  }

  get newItem() {
    return {
      name: '',
      desc: '',
      logo: '',
      settings: {
        banners: [],
        examGroups: [],
        assistantGroups: [],
        seriesGroups: [],
      }
    };
  }

  get editingItem() {
    return this.client;
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


  setEditingField(field, value) {
    this.client[field] = value;
  }

  startEditing() {
    this.originalBanners = [...this.client.settings.banners];
    this.changes = [];
  }

  cancelEditing() {
    this.client.settings.banners = [...this.originalBanners];
    this.previewUrls = [...this.originalBanners];
    this.changes = [];
  }

  async saveChanges(type = 'banners') {
    this.loading = true;
    this.error = null;

    try {
      if (type === 'banners') {
        const folder = `${this.client.id}/banners`;

        // Process changes in order
        for (const change of this.changes) {
          if (change.type === 'add') {
            const url = await uploadToCloudinary(change.data, folder);
            const index = this.client.settings.banners.indexOf('');
            if (index > -1) {
              this.client.settings.banners[index] = url;
            }
          } else if (change.type === 'delete') {
            // Extract public_id from the Cloudinary URL
            const urlParts = change.data.split('/');
            const publicId = `${folder}/${urlParts[urlParts.length - 1].split('.')[0]}`;
            await deleteFromCloudinary(publicId);
          }
        }

        // Process changes in order
        for (const change of this.changes) {
          if (change.type === 'add') {
            const url = await uploadToCloudinary(change.data, folder);
            const index = this.client.settings.banners.indexOf('');
            if (index > -1) {
              this.client.settings.banners[index] = url;
            }
          } else if (change.type === 'delete') {
            // Extract public_id from the Cloudinary URL
            const urlParts = change.data.split('/');
            const publicId = `${folder}/${urlParts[urlParts.length - 1].split('.')[0]}`;
            await deleteFromCloudinary(publicId);
          }
        }
      }

      // Save client object
      const response = await this.save();

      if (!response.ok) {
        throw new Error(`Failed to save changes: ${response.status}`);
      }

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
        this.showErrorDialog();
      });
    }
  }

  save = async () => {
    this.loading = true;
    this.error = null;

    try {
      // Handle logo upload if there's a file selected
      if (this.client.logo instanceof File) {
        const logoKey = `clients/${this.client.id}/logo.png`;
        const logoUrl = await uploadToTOS(this.client.logo, logoKey);
        
        runInAction(() => {
          this.client.logo = logoUrl;
        });
      }

      // Save client data to database
      const response = await save('clients', omit(this.client, ['_id', 'memberships', 'assistants']));
      
      runInAction(() => {
        this.loading = false;
      });
      
      return response;
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
        this.showErrorDialog();
      });
      throw error;
    }
  };

  deleteBanner(index) {
    const url = this.client.settings.banners[index];
    if (url && url !== '') {
      this.changes.push({ type: 'delete', data: url });
    }
    this.client.settings.banners.splice(index, 1);
    this.previewUrls.splice(index, 1);
  }

  addBanner() {
    this.client.settings.banners.push('');
    this.previewUrls.push('');
  }

  setPreviewUrl(index, file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      runInAction(() => {
        this.previewUrls[index] = reader.result;
      });
    };
    reader.readAsDataURL(file);
  }

  handleImageSelect(file, index) {
    this.setPreviewUrl(index, file);
    this.changes.push({ type: 'add', data: file, index });
  }

  loadClient = async function() {
    this.loading = true;
    this.error = null;

    try {
      const data = await get('clients', { id: 1 });
      
      runInAction(() => {
        if (data && data.length > 0) {
          this.client = data[0];
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
        this.showErrorDialog();
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

  showErrorDialog() {
    this.isErrorDialogOpen = true;
  }

  hideErrorDialog() {
    this.isErrorDialogOpen = false;
    this.error = null;
  }

  showConfirmDialog() {
    this.isConfirmDialogOpen = true;
  }

  hideConfirmDialog() {
    this.isConfirmDialogOpen = false;
  }
}

export default combineStores(PageStore, EditingStore, ClientStore);