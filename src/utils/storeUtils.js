import { makeAutoObservable } from "mobx";

export const combineStores = (...storeClasses) => {
  const combined = {};
  
  storeClasses.forEach(storeClass => {
    const store = new storeClass();

    // Copy own properties
    const ownDescriptors = Object.getOwnPropertyDescriptors(store);
    Object.defineProperties(combined, ownDescriptors);
    
    // Copy getters from prototype chain
    let prototype = Object.getPrototypeOf(store);
    while (prototype && prototype !== Object.prototype) {
      const prototypeDescriptors = Object.getOwnPropertyDescriptors(prototype);
      
      Object.keys(prototypeDescriptors).forEach(key => {
        const descriptor = prototypeDescriptors[key];
        
        // Only copy getters (and setters if they exist) that aren't already defined
        if ((descriptor.get || descriptor.set) && !combined.hasOwnProperty(key)) {
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

  console.log(combined);

  // combined.initData && combined.initData();

  return combined;
};