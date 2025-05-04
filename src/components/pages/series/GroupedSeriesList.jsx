import React from 'react';
import { observer } from 'mobx-react-lite';
import SeriesCard from './SeriesCard';
import { AccordionSection } from '../../ui/AdminAccordion';
import languageStore from '../../../stores/languageStore';
import routeStore from '../../../stores/routeStore';
import groupedSeriesStore from '../../../stores/groupedSeriesStore';

const GroupedSeriesList = observer(() => {
  const { t } = languageStore;

  return (
    <div className="w-full space-y-4">
        {groupedSeriesStore.groupEntries.map(([group, series], index) => (
          <AccordionSection
            key={group}
            title={`${group} (${series.length})`}
            isExpanded={groupedSeriesStore.isGroupExpanded(group)}
            onToggle={() => groupedSeriesStore.toggleGroup(group)}
            maxHeight="96"
            index={index}
            moveGroup={groupedSeriesStore.moveGroup}
            isDraggable={routeStore.isSeriesSettingMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2">
              {series.map((seriesItem, index) => (
                <SeriesCard
                  key={`${group}-${seriesItem.id}-${index}`}
                  series={seriesItem}
                  index={index}
                  moveItem={(fromIndex, toIndex) =>
                    routeStore.isSeriesSettingMode &&
                    groupedSeriesStore.moveSeriesInGroup(group, fromIndex, toIndex)
                  }
                />
              ))}
            </div>
          </AccordionSection>
        ))}
    </div>
  );
});

export default GroupedSeriesList;