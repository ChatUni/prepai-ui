import { makeAutoObservable } from 'mobx';

class CounterStore {
  count = 0;

  constructor() {
    makeAutoObservable(this);
  }

  increment = () => {
    this.count += 1;
  };
}

// Create a singleton instance
const counterStore = new CounterStore();

export default counterStore;
