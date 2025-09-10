import { db } from "../server/db.js";

const startGame = async (req, res) => {
  const { roomNumber } = req.body;

  if (!roomNumber) {
    return res.status(400).json({ error: "Room number is required" });
  }

  try {
    const [roomRows] = await db.query(
      "SELECT hosts_id, participants FROM rooms WHERE room_number = ?",
      [roomNumber],
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    const { hosts_id } = roomRows[0];
    let participants = [];
    try {
      participants = roomRows[0].participants
        ? JSON.parse(roomRows[0].participants)
        : [];
      if (!Array.isArray(participants)) participants = [];
    } catch (_) {
      participants = [];
    }

    console.log("StartGame - Original participants from DB:", participants);
    console.log("StartGame - Host ID:", hosts_id);

    const hostIdString = hosts_id?.toString();
    if (hostIdString && !participants.includes(hostIdString)) {
      participants.push(hostIdString);
      console.log("StartGame - Added host to participants:", participants);
    }

    await db.query(
      "UPDATE rooms SET participants = ?, game_started = ? WHERE room_number = ?",
      [JSON.stringify(participants), true, roomNumber],
    );

    // Build game session now: collect tracks for participants, shuffle 10, reset scores
    if (participants.length) {
      console.log("Creating game session for participants:", participants);
      const placeholders = participants.map(() => "?").join(",");
      const [tracks] = await db.query(
        `SELECT name, artists, COALESCE(cover,'') as cover, COALESCE(preview_url,'') as preview_url, songId, userId as ownerId
         FROM tracks WHERE userId IN (${placeholders}) ORDER BY RAND() LIMIT 30`,
        participants,
      );
      console.log(`Found ${tracks.length} tracks for game session`);
      console.log(
        "Track owners:",
        tracks.map((t) => t.ownerId),
      );
      const shuffled = tracks.sort(() => Math.random() - 0.5).slice(0, 10);
      console.log(
        "Selected 10 songs:",
        shuffled.map((s) => `${s.name} by ${s.ownerId}`),
      );
      await db.query(
        "REPLACE INTO game_sessions (room_number, songs, current_index, total) VALUES (?, ?, ?, ?)",
        [roomNumber, JSON.stringify(shuffled), 0, 10],
      );
      // Reset/init scores
      await db.query("DELETE FROM game_scores WHERE room_number = ?", [
        roomNumber,
      ]);
      for (const pid of participants) {
        await db.query(
          "INSERT INTO game_scores (room_number, user_id, score) VALUES (?, ?, 0)",
          [roomNumber, pid],
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Game started",
      redirectUrl: `/game/${roomNumber}`,
    });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ error: "Failed to start game" });
  }
};

export { startGame };
