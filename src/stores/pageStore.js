import routeStore from './routeStore';

class PageStore {
  loading = false;
  error = '';
  confirmType = '';
  info = '';
  //queryParams = {};

  get isSettingRoute() {
    const isSetting = /\/settings$|\/.*-setting$/.test(routeStore.currentPath);
    return isSetting || this.isUserAssistantRoute;
  }

  get isUserRoute() {
    return routeStore.currentPath.endsWith('/user');
  }

  get isPaidRoute() {
    return routeStore.currentPath.endsWith('/paid');
  }

  get isUserAssistantRoute() {
    return routeStore.currentPath.endsWith('/assistants/user');
  }

  reset = function() {
    this.loading = false;
    this.error = null;
  }

  openErrorDialog = function(error) {
    this.error = error;
  };

  closeErrorDialog = function() {
    this.error = '';
  };

  openConfirmDialog = function(type) {
    this.confirmType = type;
  };

  closeConfirmDialog = function() {
    this.confirmType = '';
  };

  openInfoDialog = function(info) {
    this.info = info;
  };

  closeInfoDialog = function() {
    this.info = '';
  };

  confirm = async function(type) {
    if (!type) return;
    const func = `confirm${type[0].toUpperCase() + type.slice(1)}`;
    this[func] && await this[func]();
  };

  // setQueryParams = function(params) {
  //   this.queryParams = { ...params };
  // };

  // getQueryParam = function(key) {
  //   return this.queryParams[key];
  // };
}

export default PageStore;