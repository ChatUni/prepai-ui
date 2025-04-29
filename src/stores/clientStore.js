import { makeAutoObservable, runInAction } from 'mobx';

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

  constructor() {
    makeAutoObservable(this);
    this.loadClient();
  }

  async deleteBanner(index) {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch(`/api/clients/1/banners/${index}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete banner: ${response.status}`);
      }

      runInAction(() => {
        this.client.settings.banners.splice(index, 1);
        this.previewUrls.splice(index, 1);
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
  }

  async addBanner() {
    this.loading = true;
    this.error = null;

    try {
      const response = await fetch('/api/clients/1/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ index: this.client.settings.banners.length })
      });

      if (!response.ok) {
        throw new Error(`Failed to add banner: ${response.status}`);
      }

      runInAction(() => {
        this.client.settings.banners.push('');
        this.previewUrls.push('');
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
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

  async uploadBanner(file, index) {
    this.loading = true;
    this.error = null;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('index', index);

      const response = await fetch('/api/clients/1/banners', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Failed to upload banner: ${response.status}`);
      }

      const data = await response.json();
      
      runInAction(() => {
        this.client.settings.banners[index] = data.url;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.message;
        this.loading = false;
      });
    }
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