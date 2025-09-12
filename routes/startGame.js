import { db } from "../server/db.js";

const startGame = async (req, res) => {
  const { roomNumber } = req.body;
  if (!roomNumber)
    return res.status(400).json({ error: "Room number is required" });

  try {
    const [roomRows] = await db.query(
      "SELECT hosts_id, participants FROM rooms WHERE room_number = ?",
      [roomNumber],
    );
    if (roomRows.length === 0)
      return res.status(404).json({ error: "Room not found" });

    const { hosts_id } = roomRows[0];

    // participants is already parsed by MySQL as an object
    let participants = roomRows[0].participants || [];
    if (!Array.isArray(participants)) participants = [];

    // Always include host in participants
    if (hosts_id && !participants.includes(hosts_id)) {
      participants.push(hosts_id);
    }

    console.log("Final participants list:", participants);

    // persist participants & mark game started
    await db.query(
      "UPDATE rooms SET participants = ?, game_started = ? WHERE room_number = ?",
      [JSON.stringify(participants), true, roomNumber],
    );

    // collect tracks balanced per user (target total 10)
    const targetTotal = 10;
    const perUser = Math.max(1, Math.ceil(targetTotal / participants.length));
    let collected = [];

    for (const pid of participants) {
      const [userTracks] = await db.query(
        `SELECT name, artists, COALESCE(cover,'') as cover, COALESCE(preview_url,'') as preview_url, songId, userId as ownerId
         FROM tracks WHERE userId = ? ORDER BY RAND() LIMIT ?`,
        [pid, perUser],
      );
      collected = collected.concat(userTracks || []);
    }

    // if we still have < targetTotal (maybe some users have no tracks), attempt to fill from any user
    if (collected.length < targetTotal) {
      const placeholders = participants.map(() => "?").join(",");
      const [extra] = await db.query(
        `SELECT name, artists, COALESCE(cover,'') as cover, COALESCE(preview_url,'') as preview_url, songId, userId as ownerId
         FROM tracks WHERE userId IN (${placeholders}) ORDER BY RAND() LIMIT ?`,
        [...participants, targetTotal - collected.length],
      );
      collected = collected.concat(extra || []);
    }

    // shuffle and slice to exactly targetTotal (or less if not enough)
    const shuffled = collected
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(targetTotal, collected.length));

    // normalize song objects and add answered flag
    const songs = shuffled.map((t) => ({
      trackId: t.songId,
      name: t.name,
      artists: t.artists,
      cover: t.cover || "",
      preview_url: t.preview_url || "",
      ownerId: t.ownerId?.toString(),
      answered: false,
    }));

    // save game session
    await db.query(
      "REPLACE INTO game_sessions (room_number, songs, current_index, total) VALUES (?, ?, ?, ?)",
      [roomNumber, JSON.stringify(songs), 0, songs.length],
    );

    // reset scores
    await db.query("DELETE FROM game_scores WHERE room_number = ?", [
      roomNumber,
    ]);
    for (const pid of participants) {
      await db.query(
        "INSERT INTO game_scores (room_number, user_id, score) VALUES (?, ?, 0)",
        [roomNumber, pid],
      );
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
