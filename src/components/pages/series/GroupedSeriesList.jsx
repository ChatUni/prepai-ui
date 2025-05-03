import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import SeriesCard from './SeriesCard';
import { AccordionSection } from '../../ui/AdminAccordion';
import languageStore from '../../../stores/languageStore';
import coursesStore from '../../../stores/coursesStore';

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

  const groupedSeries = tap(coursesStore.groupedSeries);

  return (
    <div className="w-full space-y-4">
      {Object.entries(groupedSeries).map(([group, series]) => (
        <AccordionSection
          key={group}
          title={`${group} (${series.length})`}
          isExpanded={expandedGroups.has(group)}
          onToggle={() => toggleGroup(group)}
          maxHeight="96"
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
  );
});

export default GroupedSeriesList;