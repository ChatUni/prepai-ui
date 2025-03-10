import { observer } from 'mobx-react-lite';
import coursesStore from '../stores/coursesStore';
import realtimeSessionStore from '../stores/realtimeSessionStore';
import EventLog from './ui/EventLog';
import SessionControls from './ui/SessionControls';

const InstructorChatPage = () => {
  console.log('aa')
  const instructor = coursesStore.instructors.find(instructor => instructor.id === 1)
  return (
    <div className="flex flex-col h-full pb-20 md:pb-6 px-4 md:px-6">
      {/* Header with instructor info */}
      <div className="flex items-center py-4 border-b">
        <div className="flex items-center">
          <img
            src={instructor.image}
            alt={instructor.name}
            className="rounded-full w-12 h-12 object-cover mr-4"
          />
          <div>
            <h2 className="text-xl font-bold">{instructor.name}</h2>
            <p className="text-sm text-gray-600">实时聊天</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex flex-col flex-grow h-full overflow-hidden">
          <div className="hidden md:block h-32 overflow-y-auto bg-gray-800 text-gray-200 p-2 text-xs font-mono">
            <EventLog />
          </div>
        
        
        {/* Session Controls */}
        <div className="p-4 border-t bg-white">
          <SessionControls />
        </div>
      </div>
    </div>
  );
};

export default InstructorChatPage;