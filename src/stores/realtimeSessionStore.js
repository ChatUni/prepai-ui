import { makeAutoObservable, runInAction } from "mobx";

class RealtimeSessionStore {
  isSessionActive = false;
  events = [];
  dataChannel = null;
  peerConnection = null;
  audioElement = null;

  constructor() {
    makeAutoObservable(this);
  }

  async startSession() {
    try {
      // Get an ephemeral key from the Fastify server
      const tokenResponse = await fetch("/token");
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
          this.sendClientEvent({ type: "session.update", session: { voice: "ash", instructions: `你只说中文。你根据如下知识回答用户问题。
好的。各位亲爱的同学，大家上网好。
很高兴又看到这么多大一的同学。
我已经很久没有教过大一了。
这期我们开始高等数学的学习。
首先，简单的自我介绍一下。姓宋，名号。名叫宋浩。
在我们学校哪个老师的名字最火？就是宋浩这个老师的名字最火。
我可以保证在我们学校大一大二所有的学生都认识我。
在大概近五六年吧，几乎我们学校所有的学生的数学课好像都交给了宋老师。
我的新浪微博是宋浩老师。
还有个夏花线。还有个Ice。还有个Mouse。
哎，老师怎么还有个冰还有个老鼠呢？
其实我原来的这个新浪微博只有这个，就是Ice夏花线Mouse。
那老师为什么有个冰呢？这个肯定和一个女生有关，对不对？
毫无疑问，毫无疑问。
这个故事现在也不敢说了，因为她是一个前任，对不对？
所以我现在的媳妇刚认识老鼠，就问，哎，宋老师，怎么你的新浪微博叫冰老鼠呢？
怎么有个冰字呢？我照顾，敷衍她一下，就说随便起来嘛，对不对？
那肯定是有故事的，对不对？
因为这个老师为什么不改名呢？
因为这个Ice夏花线Mouse，我近五六年一直用的这个新浪微博。
然后所有的这个视频上留的微博都留的是这个，所以这个不能改。
前段时间，有同学说，老师，你这个微博太难找了，很多人找都找不着。
所以前段时间我就加了一个宋浩老师，这个倒是比较好认。
然后我媳妇前两天又看见了，哎，宋老师，新浪微博改名了呀，改了个宋浩老师。
我说，那为什么后面的那几个字不改呀？
我说，那不原来的那点事吗？
所以就没改，对不对？
所以就是新浪微博就是这样的一个故事。
新浪微博粉丝也不是特别多，现在也就是三万多而已，也就三万多而已。
大家没事，可以加加我的新浪微博。
新浪微博粉丝不多，但是浏览量很大。
每年的浏览量每年超过一千万次，是一点问题都没有的。
我的B站。
B站叫送号Big Mouse。
送号Big Mouse，送号大老鼠，对不对？
男友突然说，老老师，这个大字还有故事吗？
这个大字也有个故事，对不对？
因为我原来有过一个女朋友，叫做大壮，对不对？
就是看玩笑的。
这个就叫送号Big Mouse B站。
B站现在访问量很大。
我的视频啊，从B站上放了现在一年。
现在访问量啊，总的播放量已经超过了两百万次。
B站的粉丝现在差不多五万多。
五万多。
现在B站上的人啊，现在B站上看我的视频的人啊，
我大概估算了一下将近二十万人。
因为他那个不是所有的看你视频的人都会关注你，对不对？
他的关注率啊，才百分之三十。
那有时候我现在粉丝是五万多。
你除以0.3，就是总的视频观看的人数。
当然你从B站上，你不要送送号，对不对？
如果要收送号呢，饶入我，那就太low了。
          ` } })
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

  sendTextMessage(message) {
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
    this.sendClientEvent({ type: "response.create" });
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