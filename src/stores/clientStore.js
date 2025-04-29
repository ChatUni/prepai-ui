import { makeAutoObservable, runInAction } from 'mobx';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryHelper';

class ClientStore {
  client = {
    id: 1,
    name: '',
    settings: {
      banners: []
    }
  };
  loading = false;
  error = null;
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
    this.loadClient();
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

  async saveChanges() {
    this.loading = true;
    this.error = null;

    try {
      // Process changes in order
      for (const change of this.changes) {
        if (change.type === 'add') {
          const url = await uploadToCloudinary(change.data, 'banners');
          this.client.settings.banners.push(url);
        } else if (change.type === 'delete') {
          // Extract public_id from the Cloudinary URL
          const urlParts = change.data.split('/');
          const publicId = `banners/${urlParts[urlParts.length - 1].split('.')[0]}`;
          await deleteFromCloudinary(publicId);
        }
      }

      // Save client object
      const response = await fetch('/api/save', {
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
        this.originalBanners = [...this.client.settings.banners];
        this.changes = [];
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
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
    this.changes.push({ type: 'add', data: file });
  }

  async loadClient() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('/api/clients/1');
      
      if (!response.ok) {
        throw new Error(`Failed to load client: ${response.status}`);
      }

      const data = await response.json();
      
      runInAction(() => {
        if (data) {
          this.client = data;
        } else {
          this.error = 'Client not found';
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }

  get isLoading() {
    return this.loading;
  }

  get hasError() {
    return !!this.error;
  }
}

// Create and export a singleton instance
const clientStore = new ClientStore();
export default clientStore;