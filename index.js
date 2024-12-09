import dotenv from "dotenv";
import express from "express";
import querystring from "querystring";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { createRoom } from "./server/createRoom.js";
import { getSpotifyAccessToken } from "./server/generateToke.js";
import { joinRoom } from "./server/joinRoom.js";
import { fileURLToPath } from "url";
import { db } from "./server/db.js";
dotenv.config();

const port = 5500;

const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
// const redirect_uri = "http://127.0.0.1:5500/index.html";
const redirect_uri = "http://127.0.0.1:5500/callback";
const stateKey = "spotify_auth_state";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const generateRandomString = (length) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const app = express();
app.get("/login", (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = " user-top-read user-read-private user-read-email";
  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state,
        show_dialog: "true",
      }),
  );
});

app
  .use(express.static(path.join(__dirname, "/public")))
  .use(cors())
  .use(cookieParser());

app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect("/#" + querystring.stringify({ error: "state_mismatch" }));
  } else {
    res.clearCookie(stateKey);

    try {
      const authOptions = {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization":
            "Basic " +
            Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
        },
        body: new URLSearchParams({
          code: code,
          redirect_uri: redirect_uri,
          grant_type: "authorization_code",
        }),
      };

      const response = await fetch(
        "https://accounts.spotify.com/api/token",
        authOptions,
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          `Token request failed: ${response.status} - ${JSON.stringify(
            errorData,
          )}`,
        );
      }

      const data = await response.json();
      const access_token = data.access_token;
      const refresh_token = data.refresh_token;
      res.redirect(
        `/#${querystring.stringify({ access_token, refresh_token })}`,
      );
    } catch (error) {
      console.error("Error during token exchange:", error);
      res.redirect(`/#${querystring.stringify({ error: error.message })}`);
    }
  }
});

app.get("/refresh_token", async (req, res) => {
  try {
    const refresh_token = req.query.refresh_token;
    const authOptions = {
      method: "POST",
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${client_id}:${client_secret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=refresh_token&refresh_token=${refresh_token}`,
    };

    const response = await fetch(
      "https://accounts.spotify.com/api/token",
      authOptions,
    );
    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ message: "Unknown error from Spotify API" }));
      throw new Error(
        `Refresh token request failed: ${response.status} - ${JSON.stringify(
          errorData,
        )}`,
      );
    }

    const data = await response.json();
    const access_token = data.access_token;
    res.json({ access_token });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).send({ error: error.message });
  }
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/room/:roomNumber", async (req, res) => {
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

    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
         <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="author" content=" Anastasia Bobere" />
    <meta name="description" content="Spotify Api roulette game" />
    <meta name="keywords" content="Spotify WEB API Game roulette" />
    <script
      src="https://kit.fontawesome.com/1995a9df69.js"
      crossorigin="anonymous"></script>
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
        
        <div id="room-id-display"></div>
        <div id="host-id"></div>
        <h2>Participants:</h2>
        <ul id="participants-list"></ul>
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

          // Extract room number from the URL
          const roomNumber = window.location.pathname.split("/")[2];
          document.getElementById("room-id-display").textContent = "Room ID: " + roomNumber;

          // Display host ID
          const hostIdElement = document.getElementById("host-id");
          hostIdElement.textContent = "Host ID: " + roomData.host_id;

          // Display participants list
          const participantsListElement = document.getElementById("participants-list");
          roomData.participants.forEach((participantId) => {
            const li = document.createElement("li");
            li.textContent = participantId;
            participantsListElement.appendChild(li);
          });
        </script>
         <script src="https://code.jquery.com/jquery-3.6.3.min.js"></script>
    <script src="/js/room.js"></script>
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

app.post("/create-room", createRoom);
app.post("/join-room", joinRoom);

app.post("/generateToken", async (req, res) => {
  try {
    const token = await getSpotifyAccessToken(); // Call the function
    res.status(200).json({ success: true, accessToken: token }); // Send token to client
  } catch (error) {
    console.error("Error generating Spotify token:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
