import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useNavigate, useSearchParams } from 'react-router-dom';
import instructorStore from '../../../stores/instructorStore';
import languageStore from '../../../stores/languageStore';
import InstructorSearchBar from '../../ui/InstructorSearchBar';
import LoadingState from '../../ui/LoadingState';

const InstructorSelectPage = observer(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = languageStore;

  // Get mode from URL params
  const mode = searchParams.get('mode') || 'edit';

  useEffect(() => {
    // Load instructors data if not already loaded
    if (instructorStore.instructors.length === 0) {
      instructorStore.fetchInstructors();
    }
  }, []);

  const handleInstructorClick = (instructor) => {
    navigate(`/instructors/${instructor.id}/edit`);
  };

  return (
    <div className="container mx-auto px-4 py-8 pb-20 md:pb-8 h-full flex flex-col">
      <h1 className="text-2xl font-bold mb-6">
        {t('instructors.selectToEdit')}
      </h1>
      <div className="mb-8 flex-shrink-0">
        <InstructorSearchBar />
      </div>
      <div className="bg-white rounded-lg shadow flex-1 overflow-hidden">
        <div className="divide-y divide-gray-200 overflow-y-auto h-full">
          <LoadingState
            isLoading={instructorStore.loading}
            isEmpty={!instructorStore.loading && instructorStore.filteredInstructors.length === 0}
            customMessage={
              instructorStore.loading ? t('common.loading') :
              instructorStore.filteredInstructors.length === 0 ? t('common.no_results') :
              null
            }
          >
            {instructorStore.filteredInstructors.map(instructor => (
              <div
                key={instructor.id}
                onClick={() => handleInstructorClick(instructor)}
                className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{instructor.name}</h3>
                    {instructor.title && (
                      <p className="text-sm text-gray-600 mb-1">
                        {instructor.title}
                      </p>
                    )}
                    {instructor.expertise && (
                      <p className="text-sm text-gray-500">
                        {instructor.expertise}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </LoadingState>
        </div>
      </div>
    </div>
  );
});

export default InstructorSelectPage;