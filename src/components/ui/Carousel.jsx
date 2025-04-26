import React from 'react';
import { observer } from 'mobx-react-lite';
import carouselStore from '../../stores/carouselStore';

const Carousel = observer(() => {
  if (carouselStore.images.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
        <img
          src={carouselStore.images[carouselStore.currentImageIndex]}
          alt="Series Cover"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      {carouselStore.images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {carouselStore.images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === carouselStore.currentImageIndex
                  ? 'bg-white'
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default Carousel;