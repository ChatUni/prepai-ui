import { makeAutoObservable, runInAction } from "mobx";
import { BASE_URL } from '../config.js';
import coursesStore from './coursesStore';

class RealtimeSessionStore {
  isSessionActive = false;
  events = [];
  dataChannel = null;
  peerConnection = null;
  audioElement = null;
  instructions = '';
  isTextareaFocused = false;
  currentVectorStoreIds = [];

  constructor() {
    makeAutoObservable(this);
  }

  setInstructions(text) {
    this.instructions = text;
  }

  // Update vector store IDs when instructor series changes
  updateVectorStoreIds(instructorId) {
    runInAction(() => {
      // Get all series for this instructor
      const instructorSeries = coursesStore.series.filter(s => s.instructor_id === instructorId);
      // Extract vector_store_ids, filter out any undefined/null values
      this.currentVectorStoreIds = instructorSeries
        .map(s => s.vector_store_id)
        .filter(id => id != null);
    });
  }

  // Call the file search endpoint
  async searchFiles(question) {
    try {
      const response = await fetch(`${BASE_URL}/openai/file_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          vectorStoreId: this.currentVectorStoreIds[0] // Use first vector store for now
        })
      });

      if (!response.ok) {
        throw new Error('Failed to search files');
      }

      return await response.json();
    } catch (error) {
      console.error('File search error:', error);
      return null;
    }
  }

  setTextareaFocus(focused) {
    this.isTextareaFocused = focused;
  }

  async startSession() {
    try {
      // Get an ephemeral key from the Netlify function
      const tokenResponse = await fetch(`${BASE_URL}/realtime-token`);
      const data = await tokenResponse.json();
      const EPHEMERAL_KEY = data.client_secret.value;

      // Create a peer connection
      const pc = new RTCPeerConnection();

      // Set up to play remote audio from the model
      this.audioElement = document.createElement("audio");
      this.audioElement.autoplay = true;
      pc.ontrack = (e) => (this.audioElement.srcObject = e.streams[0]);

      // Add local audio track for microphone input in the browser
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);

      // Set up data channel for sending and receiving events
      const dc = pc.createDataChannel("oai-events");
      
      // Attach event listeners to the data channel
      dc.addEventListener("message", (e) => {
        runInAction(() => {
          this.events = [JSON.parse(e.data), ...this.events];
        });
      });

      dc.addEventListener("open", () => {
        runInAction(() => {
          this.isSessionActive = true;
          this.events = [];
          this.sendClientEvent({
            type: "session.update",
            session: {
              voice: "ash",
              instructions: this.instructions || '你只说中文。'
            }
          })
        });
      });

      // Start the session using the Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-mini-realtime-preview";
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer);

      runInAction(() => {
        this.peerConnection = pc;
        this.dataChannel = dc;
      });
    } catch (error) {
      console.error("Failed to start session:", error);
    }
  }

  stopSession() {
    if (this.dataChannel) {
      this.dataChannel.close();
    }

    if (this.peerConnection) {
      this.peerConnection.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
        }
      });
      this.peerConnection.close();
    }

    runInAction(() => {
      this.isSessionActive = false;
      this.dataChannel = null;
      this.peerConnection = null;
      this.instructions = '';
    });
  }

  sendClientEvent(message) {
    if (this.dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      this.dataChannel.send(JSON.stringify(message));
      runInAction(() => {
        this.events = [message, ...this.events];
      });
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

  async sendTextMessage(message) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    this.sendClientEvent(event);

    // If we have vector store IDs available, include the file search tool
    if (this.currentVectorStoreIds.length > 0) {
      const toolEvent = {
        type: "response.create",
        response: {
          tools: [{
            type: "file_search",
            vector_store_ids: this.currentVectorStoreIds,
          }]
        }
      };
      this.sendClientEvent(toolEvent);
    } else {
      // Otherwise send normal response create event
      this.sendClientEvent({ type: "response.create" });
    }
  }

  sendInstruction(instruction) {
    const event = {
      type: "response.create",
      response: {
        instructions: instruction,
      },
    };

    this.sendClientEvent(event);
  }

  updateSession(sessionConfig) {
    const event = {
      type: "session.update",
      session: sessionConfig,
    };

    this.sendClientEvent(event);
  }
}

export default new RealtimeSessionStore();