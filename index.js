import dotenv from "dotenv";
import express from "express";
import querystring from "querystring";
import cookieParser from "cookie-parser";
import fetch from "node-fetch";
import cors from "cors";
import path from "path";
import { createRoom } from "./server/createRoom.js";
import { generateSpotifyToken } from "./server/generateToken.js";
import { joinRoom } from "./server/joinRoom.js";
import { fileURLToPath } from "url";
import { db } from "./server/db.js";
import roomRouter from "./routes/room.js";
import { startGame } from "./routes/startGame.js";
import { gameStatus } from "./routes/gameStatus.js";
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
          Authorization:
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

      // Fetch user profile
      const userResponse = await fetch("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!userResponse.ok) {
        throw new Error(
          `Failed to fetch user profile: ${userResponse.statusText}`,
        );
      }

      const userData = await userResponse.json();
      console.log("User Data:", userData);

      // Fetch user's top tracks
      const timeRange = "long_term"; // Options: "short_term", "medium_term", "long_term"
      const limit = 20; // Number of tracks to fetch
      const url = `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`;

      const [rows] = await db.query("SELECT * FROM users WHERE userId = ?", [
        userData.id,
      ]);

      if (rows.length === 0) {
        const topTracksResponse = await fetch(url, {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        });

        if (!topTracksResponse.ok) {
          const errorText = await topTracksResponse.text();
          console.error("Error fetching top tracks:", errorText);
          throw new Error(
            `Top tracks request failed: ${topTracksResponse.status}`,
          );
        }

        const topTracksData = await topTracksResponse.json();
        console.log("User's Top Tracks Data:", topTracksData);

        const songs = topTracksData.items.map((track) => ({
          id: track.id,
          name: track.name,
          artists: track.artists.map((artist) => artist.name).join(", "),
        }));

        console.log("Mapped Songs:", songs);

        // Insert user into the database
        const [userInsertResult] = await db.query(
          "INSERT INTO users (userId, accessToken) VALUES (?, ?)",
          [userData.id, access_token],
        );

        console.log("User Insert Result:", userInsertResult);

        // Insert tracks into the database
        for (const song of songs) {
          console.log("Processing Song:", song);

          const [existingTracks] = await db.query(
            "SELECT * FROM tracks WHERE userId = ? AND songId = ?",
            [userData.id, song.id],
          );

          if (existingTracks.length === 0) {
            const [trackInsertResult] = await db.query(
              "INSERT INTO tracks (userId, name, artists, songId) VALUES (?, ?, ?, ?)",
              [userData.id, song.name, song.artists, song.id],
            );
            console.log("Track Insert Result:", trackInsertResult);
          }
        }
      }

      res.redirect(
        `/#${querystring.stringify({ access_token, refresh_token })}`,
      );
    } catch (error) {
      console.error("Error during callback processing:", error);
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
app.use("/api/room", roomRouter);
app.get("/room/:roomNumber", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "room.html"));
});

app.post("/start-game", startGame);
app.get("/game-status", gameStatus);
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
