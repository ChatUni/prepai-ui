import { useState } from "react";
import Button from "./Button";
import { observer } from "mobx-react-lite";
import realtimeSessionStore from "../../stores/realtimeSessionStore";

function SessionStopped() {
  // Directly use the realtimeSessionStore
  const startSession = () => realtimeSessionStore.startSession();
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex items-center justify-center w-full h-full">
      <Button
        onClick={handleStartSession}
        className={isActivating ? "bg-gray-600" : "bg-red-600"}
      >
        {isActivating ? "starting session..." : "start session"}
      </Button>
    </div>
  );
}

function SessionActive() {
  // Directly use the realtimeSessionStore
  // Don't destructure methods to preserve 'this' context
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    realtimeSessionStore.sendTextMessage(message);
    setMessage("");
  }

  return (
    <div className="flex items-center justify-center w-full h-full gap-4">
      <input
        onKeyDown={(e) => {
          if (e.key === "Enter" && message.trim()) {
            handleSendClientEvent();
          }
        }}
        type="text"
        placeholder="send a text message..."
        className="border border-gray-200 rounded-full p-4 flex-1"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <Button
        onClick={() => {
          if (message.trim()) {
            handleSendClientEvent();
          }
        }}
        className="bg-blue-400"
      >
        send text
      </Button>
      <Button onClick={() => realtimeSessionStore.stopSession()}>
        disconnect
      </Button>
    </div>
  );
}

function SessionControls() {
  // Directly use the realtimeSessionStore
  const isSessionActive = realtimeSessionStore.isSessionActive;
  return (
    <div className="flex gap-4 border-t-2 border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive />
      ) : (
        <SessionStopped />
      )}
    </div>
  );
}

// Export the component wrapped with the MobX observer
export default observer(SessionControls);
