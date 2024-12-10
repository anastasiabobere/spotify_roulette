// import { db } from "./db.js";
// import express from "express";
// import path from "path";
// import { generateSpotifyToken } from "./generateToke.js";

// const router = express.Router();

// // Fetch room details
// router.get("/:roomNumber", async (req, res) => {
//   const { roomNumber } = req.params;

//   try {
//     const [room] = await db.query(
//       "SELECT host_id, participants FROM rooms WHERE room_number = ?",
//       [roomNumber],
//     );

//     if (room.length === 0) {
//       return res.status(404).send("Room not found");
//     }

//     const roomDetails = room[0];
//     let participants = [];

//     if (typeof roomDetails.participants === "string") {
//       participants = JSON.parse(roomDetails.participants.trim());
//     } else if (Array.isArray(roomDetails.participants)) {
//       participants = roomDetails.participants;
//     }
//     const accessToken = await getSpotifyAccessToken();
//     const spotifyNames = await fetchSpotifyNames(participants, accessToken);

//     res.send(`
//       <!DOCTYPE html>
//       <html lang="en">
//       <head>
//          <meta charset="UTF-8" />
//     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//     <meta name="author" content=" Anastasia Bobere" />
//     <meta name="description" content="Spotify Api roulette game" />
//     <meta name="keywords" content="Spotify WEB API Game roulette" />
//     <script
//       src="https://kit.fontawesome.com/1995a9df69.js"
//       crossorigin="anonymous"></script>
//     <link rel="stylesheet" href="/css/bg.css" />
//     <link rel="stylesheet" href="/css/main.css" />
//     <title>Spotify roulette | Room</title>
//       </head>
//       <body>
//       <section id="room">
//       <div id="head">
//         <h1>Welcome to The Room</h1>
//         <div class="bubble-id"><h2 id="room-id-display"></h2></div>
//         <button class="btn-green" onclick="startGame()">Start the Game</button>
//       </div>
//         <div class="players"></div>
// </section>
//  <div class="background">
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//       <span></span>
//     </div>
//         <script>
//           // Embed server-side data into the front-end JavaScript
//           const roomData = {
//             host_id: "${roomDetails.host_id}",
//             participants: ${JSON.stringify(participants)}
//           };

//           const roomNumber = window.location.pathname.split("/")[2];
//           document.getElementById("room-id-display").textContent = "Room ID: " + roomNumber;
//           const participantsListElement = document.querySelector(".players");

//           // Display host ID
//           const host_div = document.createElement("div");
//           const host_h3 = document.createElement("h3");
//           host_h3.textContent = roomData.host_id;
//           host_div.classList.add("player");
//           host_div.appendChild(host_h3);
//           participantsListElement.appendChild(host_div);

//           // Display participants list
//           roomData.participants.forEach((participantId) => {
//             const div = document.createElement("div");
//             const h3 = document.createElement("h3");
//             h3.textContent = participantId;
//             div.classList.add("player");
//             div.appendChild(h3);
//             participantsListElement.appendChild(div);
//           });
//         </script>
//          <script src="https://code.jquery.com/jquery-3.6.3.min.js"></script>
//     <script src="/js/roomFront.js"></script>
//     <script src="/server/createRooms.js"></script>
//     <script src="/server/joinRooms.js"></script>
//     <script src="/js/script.js"></script>
//       </body>
//       </html>
//     `);
//   } catch (error) {
//     console.error("Error fetching room details:", error);
//     res.status(500).send("Server error");
//   }
// });

// export default router;
// server/room.js
// server/room.js
import express from "express";
import { db } from "./db.js";
import { generateSpotifyToken } from "./generateToken.js";
import fetch from "node-fetch";

const router = express.Router();

// Fetch Spotify user names by ID
const fetchSpotifyNames = async (ids, accessToken) => {
  const names = [];
  for (const id of ids) {
    const url = `https://api.spotify.com/v1/users/${id}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const data = await response.json();
    names.push(data.display_name || data.name); // Handle display_name or name property
  }
  return names;
};

router.get("/:roomNumber", async (req, res) => {
  const { roomNumber } = req.params;

  try {
    const [room] = await db.query(
      "SELECT host_id, participants FROM rooms WHERE room_number = ?",
      [roomNumber],
    );

    if (room.length === 0) {
      return res.status(404).send("Room not found");
    }

    const roomDetails = room[0];
    let participants = [];

    if (typeof roomDetails.participants === "string") {
      participants = JSON.parse(roomDetails.participants.trim());
    } else if (Array.isArray(roomDetails.participants)) {
      participants = roomDetails.participants;
    }

    // Generate Spotify access token
    const accessToken = await generateSpotifyToken();
    const spotifyNames = await fetchSpotifyNames(participants, accessToken);
    const hostName = await fetchSpotifyNames(
      [roomDetails.host_id],
      accessToken,
    );

    // Send the HTML with the participants' names
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
         <meta charset="UTF-8" />
         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
         <meta name="author" content="Anastasia Bobere" />
         <meta name="description" content="Spotify Api roulette game" />
         <meta name="keywords" content="Spotify WEB API Game roulette" />
         <script src="https://kit.fontawesome.com/1995a9df69.js" crossorigin="anonymous"></script>
         <link rel="stylesheet" href="/css/bg.css" />
         <link rel="stylesheet" href="/css/main.css" />
         <title>Spotify roulette | Room</title>
      </head>
      <body>
        <section id="room">
          <div id="head">
            <h1>Welcome to The Room</h1>
            <div class="bubble-id"><h2 id="room-id-display"></h2></div>
            <button class="btn-green" onclick="startGame()">Start the Game</button>
          </div>
          <div class="players">
            <!-- Host -->
            <div class="player">
              <h3>${hostName[0]}</h3>
            </div>
            <!-- Participants -->
            ${spotifyNames
              .map(
                (name) => `
              <div class="player">
                <h3>${name}</h3>
              </div>
            `,
              )
              .join("")}
          </div>
        </section>
   <div class="background">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
        <script>
          // Embed server-side data into the front-end JavaScript
          const roomData = {
            host_id: "${roomDetails.host_id}",
            participants: ${JSON.stringify(participants)}
          };

          const roomNumber = window.location.pathname.split("/")[2];
          document.getElementById("room-id-display").textContent = "Room ID: " + roomNumber;

          // Function to add a new player to the list dynamically
          function addPlayer(name) {
            const playerDiv = document.createElement("div");
            playerDiv.classList.add("player");
            const playerName = document.createElement("h3");
            playerName.textContent = name;
            playerDiv.appendChild(playerName);
            document.querySelector(".players").appendChild(playerDiv);
          }
          
          // Example: Adding a new player after some event or user action
          // addPlayer('New Player');  // Uncomment when a new participant joins
        </script>
        <script src="https://code.jquery.com/jquery-3.6.3.min.js"></script>
        <script src="/js/roomFront.js"></script>
        <script src="/server/createRooms.js"></script>
        <script src="/server/joinRooms.js"></script>
        <script src="/js/script.js"></script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).send("Server error");
  }
});

export default router;
