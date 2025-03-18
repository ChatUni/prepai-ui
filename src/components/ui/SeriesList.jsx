import React from 'react';
import { observer } from 'mobx-react-lite';
import SeriesCard from './SeriesCard';

const SeriesList = observer(({ title, series, isAllInstructors = false }) => {
  return (
    <div className="w-full">
      {title && (
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4">{title}</h2>
      )}
      
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 ${isAllInstructors ? 'xl:grid-cols-4' : 'xl:grid-cols-3'} gap-3 md:gap-4`}>
        {series.map((seriesItem, index) => (
          <SeriesCard key={`${title}-${seriesItem.id}-${index}`} series={seriesItem} />
        ))}
      </div>
      
      <div className="mt-3 md:mt-4 text-gray-500 text-xs md:text-sm">
        显示 {series.length} 个系列
      </div>
    </div>
  );
});

export default SeriesList;