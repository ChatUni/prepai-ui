import React from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../stores/languageStore';

const LoadingState = observer(({
  isLoading = false,
  isError = false,
  isEmpty = false,
  loadingMessage,
  errorMessage,
  emptyMessage,
  children = null
}) => {
  const { t } = languageStore;

  const getMessage = () => {
    if (isLoading) return loadingMessage || t('series.loading');
    if (isError) return errorMessage || t('series.loadingError');
    if (isEmpty) return emptyMessage || t('series.noSeries');
    return null;
  };

  const message = getMessage();

  return (
    <>
      {(isLoading || isError || isEmpty) && (
        <div className="text-center py-10">
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      )}
      {!isLoading && !isError && children}
    </>
  );
});

export default LoadingState;