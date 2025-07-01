import routeStore from './routeStore';

class PageStore {
  loading = false;
  error = null;
  isErrorDialogOpen = false;

  get isAdminMode() {
    return routeStore.currentPath.endsWith('/settings');
  }

  reset = function() {
    this.loading = false;
    this.error = null;
  }

  openErrorDialog = function(error) {
    this.error = error || this.error;
    this.isErrorDialogOpen = true;
  };

  closeErrorDialog = function() {
    this.isErrorDialogOpen = false;
    this.error = '';
  };
}

export default PageStore;