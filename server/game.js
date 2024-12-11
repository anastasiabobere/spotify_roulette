import express from "express";
import { db } from "./db.js";
import { generateSpotifyToken } from "./generateToken.js";
import fetch from "node-fetch";
const game = async (req, res) => {
  const accessToken = localStorage.getItem("accessToken");

  const { roomNumber } = req.params;
  const [room] = await db.query(
    "SELECT host_id, participants FROM rooms WHERE room_number = ?",
    [roomNumber],
  );

  async function fetchAndDisplayTopTracks(accessToken) {
    const timeRange = "long_term";
    const limit = 30;

    try {
      const response = await fetch(
        `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch top tracks: ${response.status} - ${response.statusText}`,
        );
      }

      const data = await response.json();
      console.log("User's Top Tracks:", data);

      const tracks = data.items;

      localStorage.setItem("topTracks", JSON.stringify(tracks));

      displayTopTracks(tracks);
    } catch (error) {
      console.error("Error fetching top tracks:", error);
    }
  }

  await fetchAndDisplayTopTracks(accessToken);
};
export { game };
