import React, { useState, useEffect } from 'react';
import { testApiConnection } from '../../utils/db';
import { API_TYPE, getApiBaseUrl } from '../../config';

/**
 * Component that helps debug API connection issues
 */
const ApiDebugger = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const runTest = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const results = await testApiConnection();
      setTestResults(results);
    } catch (err) {
      setError(err.message);
      console.error('API Debugger error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="api-debugger fixed bottom-4 left-4 bg-white dark:bg-gray-800 rounded shadow-lg p-3 text-sm z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="font-medium mb-1 flex items-center gap-2"
      >
        <span className={`w-2 h-2 rounded-full ${testResults?.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
        API Debugger
        <span className="text-xs">{isOpen ? '▲' : '▼'}</span>
      </button>
      
      {isOpen && (
        <div className="mt-2 border-t pt-2">
          <div className="mb-2">
            <strong>Current Configuration:</strong>
            <div>API Type: {API_TYPE}</div>
            <div>Base URL: {getApiBaseUrl()}</div>
          </div>
          
          <button
            onClick={runTest}
            disabled={isLoading}
            className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isLoading ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testResults && (
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
              <div className={`font-bold ${testResults.success ? 'text-green-600' : 'text-red-600'}`}>
                {testResults.success ? 'Connection Successful' : 'Connection Failed'}
              </div>
              <div>{testResults.message}</div>
              {!testResults.success && (
                <div className="text-red-500 mt-1 text-xs whitespace-pre-wrap">
                  {testResults.error}
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="mt-2 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
              {error}
            </div>
          )}
          
          <div className="mt-3 text-xs text-gray-500">
            <p>If you're seeing HTML responses instead of JSON:</p>
            <ul className="list-disc pl-4 mt-1">
              <li>Check if the server is running</li>
              <li>Verify Netlify functions are deployed</li>
              <li>Ensure API endpoints match function names</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDebugger;