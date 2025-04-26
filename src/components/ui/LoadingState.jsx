import React from 'react';
import { observer } from 'mobx-react-lite';
import languageStore from '../../stores/languageStore';

const LoadingState = observer(({
  isLoading = false,
  isError = false,
  isEmpty = false,
  customMessage = null,
  children = null
}) => {
  const { t } = languageStore;

  const getMessage = () => {
    if (customMessage) return customMessage;
    
    if (isLoading) return t('series.loading');
    if (isError) return t('series.loadingError');
    if (isEmpty) return t('series.noSeries');
    return null;
  };

  const message = getMessage();
  if (!message && !isLoading && !isError && !isEmpty) {
    return children;
  }

  return (
    <div className="text-center py-10">
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </div>
  );
});

export default LoadingState;