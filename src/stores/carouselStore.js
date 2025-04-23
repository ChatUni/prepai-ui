import { makeAutoObservable, runInAction } from 'mobx';
import coursesStore from './coursesStore';

class CarouselStore {
  currentImageIndex = 0;
  intervalId = null;

  constructor() {
    makeAutoObservable(this);
  }

  get images() {
    return coursesStore.series
      .filter(series => typeof series.cover === 'string')
      .map(series => series.cover);
  }

  nextImage = () => {
    if (this.images.length > 0) {
      this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
    }
  }

  startRotation = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    if (this.images.length > 1) {
      // Ensure we have the correct this context
      const rotate = () => {
        runInAction(() => {
          if (this.images.length > 0) {
            this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;
          }
        });
      };
      
      // Start immediate rotation and set interval
      rotate();
      this.intervalId = setInterval(rotate, 5000);
    }
  }

  stopRotation = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  cleanup = () => {
    this.stopRotation();
    this.currentImageIndex = 0;
  }
}

const carouselStore = new CarouselStore();
export default carouselStore;