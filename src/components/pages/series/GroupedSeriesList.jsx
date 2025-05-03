import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SeriesCard from './SeriesCard';
import { AccordionSection } from '../../ui/AdminAccordion';
import languageStore from '../../../stores/languageStore';
import coursesStore from '../../../stores/coursesStore';
import routeStore from '../../../stores/routeStore';

const GroupedSeriesList = observer(() => {
  const { t } = languageStore;
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const toggleGroup = (group) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  const moveGroup = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    console.log('Moving group from', fromIndex, 'to', toIndex);
    coursesStore.moveGroup(fromIndex, toIndex);
  };

  const groupedSeries = coursesStore.groupedSeries;
  const groups = Object.entries(groupedSeries);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="w-full space-y-4">
        {groups.map(([group, series], index) => (
          <AccordionSection
            key={group}
            title={`${group} (${series.length})`}
            isExpanded={expandedGroups.has(group)}
            onToggle={() => toggleGroup(group)}
            maxHeight="96"
            index={index}
            moveGroup={moveGroup}
            isDraggable={routeStore.isSeriesSettingMode}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 p-2">
              {series.map((seriesItem, index) => (
                <SeriesCard
                  key={`${group}-${seriesItem.id}-${index}`}
                  series={seriesItem}
                />
              ))}
            </div>
          </AccordionSection>
        ))}
      </div>
    </DndProvider>
  );
});

export default GroupedSeriesList;