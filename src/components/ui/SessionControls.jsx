import { useState } from "react";
import Button from "./Button";
import { observer } from "mobx-react-lite";
import realtimeSessionStore from "../../stores/realtimeSessionStore";

const SessionStopped = observer(() => {
  const store = realtimeSessionStore;
  const { instructions, isTextareaFocused } = store;

  const handleStartSession = () => {
    if (store.isSessionActive) return;
    store.startSession();
  };

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      {/* <textarea
        value={instructions}
        onChange={(e) => store.setInstructions(e.target.value)}
        onFocus={() => store.setTextareaFocus(true)}
        onBlur={() => store.setTextareaFocus(false)}
        placeholder="输入指令..."
        className={`w-full p-2 text-sm border rounded resize-none transition-all duration-200 ${
          isTextareaFocused ? 'h-32' : 'h-10'
        }`}
      /> */}
      <Button
        onClick={handleStartSession}
        className={store.isSessionActive ? "bg-gray-600" : "bg-green-600"}
      >
        {store.isSessionActive ? "连接中..." : "连接"}
      </Button>
    </div>
  );
});

const SessionActive = observer(() => {
  const store = realtimeSessionStore;
  const { instructions, isTextareaFocused } = store;

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      {/* <textarea
        value={instructions}
        readOnly
        onFocus={() => store.setTextareaFocus(true)}
        onBlur={() => store.setTextareaFocus(false)}
        className={`w-full p-2 text-sm border rounded resize-none bg-gray-50 transition-all duration-200 ${
          isTextareaFocused ? 'h-32' : 'h-10'
        }`}
      /> */}
      <Button onClick={() => store.stopSession()} className="bg-red-400">
        断开
      </Button>
    </div>
  );
});

const SessionControls = () => {
  // Directly use the realtimeSessionStore
  const isSessionActive = realtimeSessionStore.isSessionActive;
  return (
    <div className="flex border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive />
      ) : (
        <SessionStopped />
      )}
    </div>
  );
};

// Export the component wrapped with the MobX observer
export default observer(SessionControls);
