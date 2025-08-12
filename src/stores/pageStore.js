import routeStore from './routeStore';

class PageStore {
  loading = false;
  error = null;
  isErrorDialogOpen = false;

  get isAdminMode() {
    const isSetting = routeStore.currentPath.endsWith('/settings');
    return isSetting || this.isUserAssistantMode;
  }

  get isUserMode() {
    return routeStore.currentPath.endsWith('/user');
  }

  get isPaidMode() {
    return routeStore.currentPath.endsWith('/paid');
  }

  get isUserAssistantMode() {
    return routeStore.currentPath.endsWith('/assistants/user');
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