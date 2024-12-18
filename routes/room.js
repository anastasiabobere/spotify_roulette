import express from "express";
import { db } from "../server/db.js";
import { generateSpotifyToken } from "../server/generateToken.js";
import fetch from "node-fetch";
import path from "path";

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
    names.push(data.display_name || data.name);
    console.log(names);
  }
  return names;
};
router.get("/:roomNumber", async (req, res) => {
  const { roomNumber } = req.params;
  try {
    const [room] = await db.query(
      "SELECT hosts_id, participants FROM rooms WHERE room_number = ?",
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
    // const spotifySongs = await fetchTopSongs(participants);
    const hostName = await fetchSpotifyNames(
      [roomDetails.hosts_id],
      accessToken,
    );
    // const people = [participants, hostName[0]];
    // people.forEach((person) => {
    //   const spotifySongs = fetchTopSongs(person, accessToken);
    // });

    // Set proper headers and send JSON response
    res.setHeader("Content-Type", "application/json");
    res.send(
      JSON.stringify({
        roomNumber,
        hostName: hostName[0],
        participants: spotifyNames,
        // songs: spotifySongs,
        roomData: {
          hosts_id: roomDetails.hosts_id,
          participants: participants,
        },
      }),
    );
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).send("Server error");
  }
});

router.post("/:roomNumber/start-game", async (req, res) => {
  const { roomNumber } = req.params;

  try {
    const [room] = await db.query(
      "SELECT hosts_id, participants FROM rooms WHERE room_number = ?",
      [roomNumber],
    );

    if (room.length === 0) {
      return res.status(404).send("Room not found");
    }

    const roomDetails = room[0];
    const participants = JSON.parse(roomDetails.participants);
    console.log("Hallo1");
    const accessToken = await generateSpotifyToken();

    const fetchTopTracks = async (userId) => {
      const url = `https://api.spotify.com/v1/users/${userId}/top/tracks?limit=5`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.items.map((track) => ({
        track_id: track.id,
        track_name: track.name,
        artist_name: track.artists.map((artist) => artist.name).join(", "),
      }));
    };
    //doesnt work probably delete
    for (const playerId of participants) {
      const tracks = await fetchTopTracks(playerId);

      for (const track of tracks) {
        await db.query(
          "INSERT INTO GAME (room_number, player_id, track_id, track_name, artist_name, round_number) VALUES (?, ?, ?, ?, ?, 1)",
          [
            roomNumber,
            playerId,
            track.track_id,
            track.track_name,
            track.artist_name,
          ],
        );
      }
    }

    await db.query("UPDATE rooms SET game_started = 1 WHERE room_number = ?", [
      roomNumber,
    ]);
    res.status(200).send("Game started successfully.");
  } catch (error) {
    console.error("Error starting the game:", error);
    res.status(500).send("Server error");
  }
});

router.get("/:roomNumber/game-data", async (req, res) => {
  const { roomNumber } = req.params;

  try {
    const [gameData] = await db.query(
      "SELECT player_id, track_name, artist_name, round_number FROM GAME WHERE room_number = ?",
      [roomNumber],
    );

    res.json(gameData);
  } catch (error) {
    console.error("Error fetching game data:", error);
    res.status(500).send("Server error");
  }
});

export default router;
