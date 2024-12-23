// import { db } from "../server/db.js";

// const startGame = async (req, res) => {
//   const { roomNumber } = req.body;

//   if (!roomNumber) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Room number is required." });
//   }

//   try {
//     const query = "UPDATE rooms SET game_started = ? WHERE room_number = ?";
//     await db.query(query, [true, roomNumber]);
//     console.log(`Game started in room ${roomNumber}`);
//     res.status(200).json({ success: true });
//   } catch (error) {
//     console.error("Error starting game:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Could not start the game." });
//   }
// };

// export { startGame };
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

    const { hosts_id, participants } = roomRows[0];
    // let updatedParticipants = JSON.parse(participants || "[]");

    if (!participants.includes(hosts_id)) {
      participants.push(hosts_id);
    }

    await db.query(
      "UPDATE rooms SET participants = ?, game_started = ? WHERE room_number = ?",
      [JSON.stringify(participants), true, roomNumber],
    );

    res.status(200).json({ success: true, message: "Game started" });
  } catch (error) {
    console.error("Error starting game:", error);
    res.status(500).json({ error: "Failed to start game" });
  }
};

export { startGame };
