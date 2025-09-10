import express from "express";
import { db } from "../server/db.js";
import { generateSpotifyToken } from "../server/generateToken.js";
import fetch from "node-fetch";
import path from "path";

const router = express.Router();

const fetchSpotifyNames = async (ids, accessToken) => {
  const names = [];
  for (const id of ids) {
    try {
      const url = `https://api.spotify.com/v1/users/${id}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error(`Failed to fetch user ${id}:`, response.status);
        names.push(id);
        continue;
      }

      const data = await response.json();
      const displayName = data.display_name || data.name || id;

      // Save/update in DB
      await db.query(
        `INSERT INTO users (userId, displayName) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE displayName = VALUES(displayName)`,
        [id, displayName],
      );

      names.push(displayName);
    } catch (err) {
      console.error(`Error fetching Spotify user ${id}:`, err.message);
      names.push(id);
    }
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

    try {
      if (
        roomDetails.participants &&
        typeof roomDetails.participants === "string"
      ) {
        participants = JSON.parse(roomDetails.participants.trim());
      } else if (Array.isArray(roomDetails.participants)) {
        participants = roomDetails.participants;
      }
    } catch {
      participants = [];
    }

    const accessToken = await generateSpotifyToken();
    const participantNames = await fetchSpotifyNames(participants, accessToken);
    const hostNameArr = await fetchSpotifyNames(
      [roomDetails.hosts_id],
      accessToken,
    );
    const hostName = hostNameArr[0];

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSON.stringify({
        roomNumber,
        hostName,
        participants: participantNames,
        roomData: {
          hosts_id: roomDetails.hosts_id,
          participants,
        },
      }),
    );
  } catch (error) {
    console.error("Error fetching room details:", error);
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
export { fetchSpotifyNames };
export default router;
