// Get peer id without hash from URL.

const myPeerId = location.hash.slice(1);

// Connect to Peer server.
peer = new Peer(myPeerId, {
  host: "glajan.com",
  port: 8443,
  path: "/myapp",
  secure: true,
});

// Print peer id on connection "open" event.
peer.on("open", (id) => {
  const myPeerIdEl = document.querySelector(".my-peer-id");
  myPeerIdEl.innerText = myPeerId;
});

// Refreshbutton shows others ID's and creates them in a list with a connect-button.

const listPeersButtonEl = document.querySelector(".list-all-peers-button");

listPeersButtonEl.addEventListener("click", () => {
  const ulEl = document.createElement("ul");
  const peersList = document.querySelector(".peers");
  peersList.firstChild && peersList.firstChild.remove();
  peer.listAllPeers((peers) => {
    peers
      .filter((p) => p !== myPeerId)
      .map((peers) => {
        const liEl = document.createElement("li");
        const peersButton = document.createElement("button");
        peersButton.innerText = peers;
        peersButton.classList.add("connect-button");
        peersButton.classList.add("peerId-${peer}");
        liEl.appendChild(peersButton);
        ulEl.appendChild(liEl);
      });
    peersList.appendChild(ulEl);
  });
});

// button for sending text message

// window auto refreshing chatmessages

// video window streaming own webcam

// video window recieving other ID's webcam

// button for starting video confrance
