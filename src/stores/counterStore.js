import { makeObservable, observable, action } from 'mobx';

class CounterStore {
  count = 0;

  constructor() {
    makeObservable(this, {
      count: observable,
      increment: action
    });
  }

  increment = () => {
    this.count += 1;
  };
}

// Create a singleton instance
const counterStore = new CounterStore();

export default counterStore;
