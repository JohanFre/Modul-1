(function () {
  let dataConnection = null;
  const peersEl = document.querySelector(".peers");
  const sendButtonEl = document.querySelector(".send-new-message-button");
  const newMessageEl = document.querySelector(".new-message");
  const messagesEl = document.querySelector(".messages");
  const theirVideoContainer = document.querySelector(".video-container.them");

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
  // get peer id from URL (no hash)
  const myPeerId = location.hash.slice(1);
  // connect to peer server
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
  // print peer id on connection "open" event.
  peer.on("open", (id) => {
    const myPeerIdEl = document.querySelector(".my-peer-id");
    myPeerIdEl.innerText = id;
  });
  // error message if there is an error
  peer.on("error", (errorMessage) => {
    console.error(errorMessage);
  });

  // On incoming connectoin.
  peer.on("connection", (connection) => {
    // Close existing connection and set new connection.
    dataConnection && dataConnection.close();
    dataConnection = connection;

    const event = new CustomEvent("peer-changed", { detail: connection.peer });
    document.dispatchEvent(event);
  });

  // event listener for click "refresh list"
  const refreshPeersButtonEl = document.querySelector(".list-all-peers-button");
  refreshPeersButtonEl.addEventListener("click", (e) => {
    peer.listAllPeers((peers) => {
      // add peers to html document
      const peersList = peers
        // filter out our own name
        .filter((peerId) => peerId !== peer._id)
        // loop through all peers and print them as buttons in a list
        .map((peer) => {
          return `<li>
      <button class="connect-button peerId-${peer}">${peer}</button>
      </li>`;
        })
        .join("");
      peersEl.innerHTML = `<ul>${peersList}</ul>`;
    });
  });
  // event listeneer for click on peer button
  peersEl.addEventListener("click", (event) => {
    if (!event.target.classList.contains("connect-button"));
    // get peerId from button element
    const theirPeerId = event.target.innerText;
    // close existing connection
    dataConnection && dataConnection.close();
    // connect to peer
    dataConnection = peer.connect(theirPeerId);

    dataConnection.on("open", () => {
      // dispatch Custom event with connected peer id
      const event = new CustomEvent("peer-changed", {
        detail: theirPeerId,
      });
      document.dispatchEvent(event);
    });
  });
  // Event listener for custom event 'peer changed'.
  document.addEventListener("peer-changed", (e) => {
    const peerId = e.detail;
    // get clicked button
    const connectButtonEl = document.querySelector(
      `.connect-button.peerId-${peerId}`
    );
    //remove class from connected
    document.querySelectorAll(".connect-button.connected").forEach((button) => {
      button.classList.remove("connected");
    });
    // add class 'connected to clicked connectbutton
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
  });
})();
