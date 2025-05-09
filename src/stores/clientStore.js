import { makeAutoObservable, runInAction } from 'mobx';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryHelper';
import lang from './languageStore';
import { get } from '../utils/db';

class ClientStore {
  client = {
    id: 1,
    name: '',
    settings: {
      banners: [],
      groups: []
    }
  };
  loading = false;
  error = null;
  isErrorDialogOpen = false;
  isConfirmDialogOpen = false;
  previewUrls = [];
  originalBanners = [];
  // Track changes as {type: 'add'|'delete', data: File|string}
  changes = [];

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

  constructor() {
    makeAutoObservable(this);
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
      const response = await fetch('/api/save?doc=clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.client)
      });

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

  async loadClient() {
    this.loading = true;
    this.error = null;

    try {
      const response = await get('clients/1');
      
      if (!response.ok) {
        throw new Error(`Failed to load client: ${response.status}`);
      }

      const data = await response.json();
      
      runInAction(() => {
        if (data) {
          this.client = data;
        } else {
          this.error = 'Client not found';
          this.showErrorDialog();
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

  async saveGroupOrder(groups) {
    this.client.settings.groups = groups;
    await this.saveChanges('groups');
  }

}

// Create and export a singleton instance
const clientStore = new ClientStore();
export default clientStore;