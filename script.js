(function () {
  let dataConnection = null;
  const peersEl = document.querySelector(".peers");
  const sendButtonEl = document.querySelector(".send-new-message-button");
  const newMessageEl = document.querySelector(".new-message");
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
    console.log("connection");

    dataConnection = connection;

    dataConnection.on("data", (textMessage) => {
      console.log(dataConnection.peer + ": " + textMessage);
    });

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

    dataConnection.on("data", (textMessage) => {
      console.log(dataConnection.peer + ": " + textMessage);
    });

    dataConnection.on("open", () => {
      // dispatch Custom event with connected peer id
      const event = new CustomEvent("peer-changed", {
        detail: theirPeerId,
      });
      document.dispatchEvent(event);
    });
  });
  // listen for custom event 'peer changed''
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
    console.log(peerId);
  });

  // Event listener for click on"send".
  sendButtonEl.addEventListener("click", () => {
    if (!dataConnection) return;
    // Get new message from text input.
    dataConnection.send(newMessageEl.value);
  });
})();
