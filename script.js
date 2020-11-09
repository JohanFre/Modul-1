// Immediately Invoked Function Expression.
(function () {
  // Global variables.
  let mediaConnection = null;
  let dataConnection = null;
  const peersEl = document.querySelector(".peers");
  const sendButtonEl = document.querySelector(".send-new-message-button");
  const newMessageEl = document.querySelector(".new-message");
  const messagesEl = document.querySelector(".messages");
  const theirVideoContainer = document.querySelector(".video-container.them");
  const videoOfThemEl = document.querySelector(".video-container.them video");
  const videoOfMeEl = document.querySelector(".video-container.me video");

  // Videostream of me.
  navigator.mediaDevices
    .getUserMedia({ audio: false, video: true })
    .then((stream) => {
      videoOfMeEl.muted = true;
      videoOfMeEl.srcObject = stream;
    });

  // Recieve message from peer.
  const printMessage = (text, who) => {
    const messageEl = document.createElement("div");
    messageEl.classList.add("message", who);
    let today = new Date();
    let time =
      ("0" + today.getHours()).slice(-2) +
      ":" +
      ("0" + today.getMinutes()).slice(-2) +
      ":" +
      ("0" + today.getSeconds()).slice(-2);
    messageEl.innerHTML = `<div>${text} <br>${time}</div>`;
    messagesEl.append(messageEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  };
  // Get peer id from URL (no hash)
  const myPeerId = location.hash.slice(1);
  // Connect to peer server
  let peer = new Peer(myPeerId, {
    host: "glajan.com",
    port: 8443,
    path: "/myapp",
    secure: true,
    config: {
      iceServers: [
        { urls: ["stun:eu-turn7.xirsys.com"] },
        {
          username:
            "1FOoA8xKVaXLjpEXov-qcWt37kFZol89r0FA_7Uu_bX89psvi8IjK3tmEPAHf8EeAAAAAF9NXWZnbGFqYW4=",
          credential: "83d7389e-ebc8-11ea-a8ee-0242ac140004",
          urls: [
            "turn:eu-turn7.xirsys.com:80?transport=udp",
            "turn:eu-turn7.xirsys.com:3478?transport=udp",
            "turn:eu-turn7.xirsys.com:80?transport=tcp",
            "turn:eu-turn7.xirsys.com:3478?transport=tcp",
            "turns:eu-turn7.xirsys.com:443?transport=tcp",
            "turns:eu-turn7.xirsys.com:5349?transport=tcp",
          ],
        },
      ],
    },
  });
  // Print peer id on connection "open" event.
  peer.on("open", (id) => {
    const myPeerIdEl = document.querySelector(".my-peer-id");
    myPeerIdEl.innerText = id;
  });
  // Error message if there is an error
  peer.on("error", (errorMessage) => {
    console.error(errorMessage);
  });

  // On incoming connection.
  peer.on("connection", (connection) => {
    // Close existing connection and set new connection.
    dataConnection && dataConnection.close();
    dataConnection = connection;

    const event = new CustomEvent("peer-changed", { detail: connection.peer });
    document.dispatchEvent(event);
  });

  // Event listener for incoming video call.
  peer.on("call", (incomingCall) => {
    mediaConnection && mediaConnection.close();

    // Change state on start/stop button.
    startVideoButton.classList.remove("active");
    stopVideoButton.classList.add("active");

    // Answer incoming call.
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: true })
      .then((myStream) => {
        incomingCall.answer(myStream);
        mediaConnection = incomingCall;
        mediaConnection.on("stream", (theirStream) => {
          videoOfThemEl.muted = true;
          videoOfThemEl.srcObject = theirStream;
        });
      });
  });

  // Event listener for click "Refresh list"
  const refreshPeersButtonEl = document.querySelector(".list-all-peers-button");
  refreshPeersButtonEl.addEventListener("click", (e) => {
    peer.listAllPeers((peers) => {
      // Add peers to html document.
      const peersList = peers
        // Filter out our own name.
        .filter((peerId) => peerId !== peer._id)
        // Loop through all peers and print them as buttons in a list.
        .map((peer) => {
          return `<li>
      <button class="connect-button peerId-${peer}">${peer}</button>
      </li>`;
        })
        .join("");
      peersEl.innerHTML = `<ul>${peersList}</ul>`;
    });
  });
  // Event listeneer for click on peer button.
  peersEl.addEventListener("click", (event) => {
    if (!event.target.classList.contains("connect-button"));
    // Get peerId from button element.
    const theirPeerId = event.target.innerText;
    // Close existing connection.
    dataConnection && dataConnection.close();
    // Connect to peer.
    dataConnection = peer.connect(theirPeerId);

    dataConnection.on("open", () => {
      // Dispatch Custom event with connected peer id.
      const event = new CustomEvent("peer-changed", {
        detail: theirPeerId,
      });
      document.dispatchEvent(event);
    });
  });
  // Event listener for custom event 'peer changed'.
  document.addEventListener("peer-changed", (e) => {
    const peerId = e.detail;
    // Get clicked button.
    const connectButtonEl = document.querySelector(
      `.connect-button.peerId-${peerId}`
    );
    // Remove class from connected.
    document.querySelectorAll(".connect-button.connected").forEach((button) => {
      button.classList.remove("connected");
    });
    // Add class 'connected to clicked connectbutton.
    connectButtonEl.classList.add("connected");

    // Listen for incoming data/textmessage.
    dataConnection.on("data", (textMessage) => {
      printMessage(textMessage, "them");
    });

    // Set focus on text input field.
    newMessageEl.focus();

    // Change elements on video-container and peer ID.
    theirVideoContainer.querySelector(".name").innerText = peerId;
    theirVideoContainer.classList.add("connected");
    theirVideoContainer.querySelector(".start").classList.add("active");
    theirVideoContainer.querySelector(".stop").classList.remove("active");
  });

  // Send message to peer.
  const sendMessage = (e) => {
    if (!dataConnection) return;
    if (newMessageEl.value === "") return;
    if (e.type === "click" || e.keyCode === 13) {
      dataConnection.send(newMessageEl.value);
      printMessage(newMessageEl.value, "me");
      // Clear text input field.
      newMessageEl.value = "";
    }
    // Set focus on text input field.
    newMessageEl.focus();
  };
  // Event listener for "send".
  sendButtonEl.addEventListener("click", sendMessage);
  newMessageEl.addEventListener("keyup", sendMessage);

  // Event listener for click "Start video chat".
  const startVideoButton = document.querySelector(".start");
  const stopVideoButton = document.querySelector(".stop");
  startVideoButton.addEventListener("click", () => {
    startVideoButton.classList.remove("active");
    stopVideoButton.classList.add("active");

    // Start video call with remote peer.
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: true })
      .then((myStream) => {
        mediaConnection && mediaConnection.close();
        const theirPeerId = dataConnection.peer;
        mediaConnection = peer.call(theirPeerId, myStream);
        mediaConnection.on("stream", (theirStream) => {
          videoOfThemEl.muted = true;
          videoOfThemEl.srcObject = theirStream;
        });
      });
  });

  // Event listener for click "Hang up"
  stopVideoButton.addEventListener("click", () => {
    stopVideoButton.classList.remove("active");
    startVideoButton.classList.add("active");
    mediaConnection && mediaConnection.close();
  });
})();
