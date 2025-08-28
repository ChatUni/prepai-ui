import { makeAutoObservable } from "mobx";

export const combineStores = (...storeClasses) => {
  const combined = {};
  const storeInstances = [];
  
  storeClasses.forEach(storeClass => {
    const store = new storeClass();
    storeInstances.push(store);

    // Copy own properties
    const ownDescriptors = Object.getOwnPropertyDescriptors(store);
    Object.defineProperties(combined, ownDescriptors);
    
    // Copy getters from prototype chain
    let prototype = Object.getPrototypeOf(store);
    while (prototype && prototype !== Object.prototype) {
      const prototypeDescriptors = Object.getOwnPropertyDescriptors(prototype);
      
      Object.keys(prototypeDescriptors).forEach(key => {
        const descriptor = prototypeDescriptors[key];
        
        // copy getters (and setters if they exist) and override previously copied
        if (descriptor.get || descriptor.set) { // && !combined.hasOwnProperty(key)) {
          Object.defineProperty(combined, key, {
            get: descriptor.get,
            set: descriptor.set,
            enumerable: descriptor.enumerable,
            configurable: descriptor.configurable
          });
        }
      });
      
      prototype = Object.getPrototypeOf(prototype);
    }
  });
  
  makeAutoObservable(combined);

  // Create init method that calls init on each store instance sequentially
  combined.init = async () => {
    for (const store of storeInstances) {
      if (store.init && typeof store.init === 'function') {
        await store.init.call(combined);
      }
    }
  };

  //console.log(combined);

  combined.init();

  return combined;
};
