import React, { useState, useEffect } from 'react';

const Carousel = ({ images, intervalDuration = 3000 }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const rotate = () => {
      setCurrentImageIndex(prevIndex => (prevIndex + 1) % images.length);
    };

    const intervalId = setInterval(rotate, intervalDuration);

    return () => {
      clearInterval(intervalId);
    };
  }, [images, intervalDuration]);

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <div className="mb-8 rounded-lg overflow-hidden shadow-lg relative">
      <div className="relative pb-[56.25%]"> {/* 16:9 aspect ratio */}
        <img
          src={images[currentImageIndex]}
          alt="Carousel Image"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      {images.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === currentImageIndex
                  ? 'bg-white'
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;