import { useState } from 'react';

const TabPanel = ({ children, className = '' }) => {
  const [activeTab, setActiveTab] = useState(0);
  
  // Filter out only valid tab children
  const tabs = children.filter(child => child.type === TabPanel.Tab);
  
  return (
    <div className={`flex flex-col bg-white rounded-lg ${className}`}>
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`flex-1 py-3 text-center font-medium ${
              activeTab === index
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab(index)}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="flex-grow overflow-y-auto p-2">
        {tabs[activeTab]}
      </div>
    </div>
  );
};

// Tab subcomponent
TabPanel.Tab = ({ children, label }) => {
  return children;
};

export default TabPanel;