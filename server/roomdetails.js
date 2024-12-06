import { db } from "./db.js";
import fetch from "node-fetch";

const getRoomDetails = async (req, res) => {
  const { roomNumber } = req.params;

  try {
    const [room] = await db.query(
      "SELECT host_id, participants FROM rooms WHERE room_number = ?",
      [roomNumber],
    );

    if (!room.length) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    const { host_id, participants } = room[0];
    const participantIds = JSON.parse(participants || "[]");
    const spotifyAccessToken = await getSpotifyAccessToken();

    // Fetch Host Display Name
    const hostResponse = await fetch(
      `https://api.spotify.com/v1/users/${host_id}`,
      {
        headers: { Authorization: `Bearer ${spotifyAccessToken}` },
      },
    );

    if (!hostResponse.ok) {
      throw new Error(
        `Failed to fetch host details: ${hostResponse.statusText}`,
      );
    }

    const hostData = await hostResponse.json();

    // Fetch Participants Display Names
    const participantDetails = await Promise.all(
      participantIds.map(async (id) => {
        const response = await fetch(`https://api.spotify.com/v1/users/${id}`, {
          headers: { Authorization: `Bearer ${spotifyAccessToken}` },
        });
        if (!response.ok) {
          return { id, display_name: "Unknown Participant" }; // Default if fetching fails
        }
        const data = await response.json();
        return { id, display_name: data.display_name };
      }),
    );

    res.status(200).json({
      success: true,
      host: { id: host_id, display_name: hostData.display_name },
      participants: participantDetails,
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown server error",
    });
  }
};

export { getRoomDetails };
