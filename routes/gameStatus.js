import { db } from "../server/db.js";

// const gameStatus = async (req, res) => {
//   const { roomNumber } = req.query;

//   if (!roomNumber) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Room number is required." });
//   }

//   try {
//     const query = "SELECT game_started FROM rooms WHERE room_number = ?";
//     const [rows] = await db.query(query, [roomNumber]);

//     if (rows.length === 0) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Room not found." });
//     }

//     const { game_started } = rows[0];
//     res.status(200).json({ success: true, gameStarted: game_started });
//   } catch (error) {
//     console.error("Error fetching game status:", error);
//     res
//       .status(500)
//       .json({ success: false, message: "Could not fetch game status." });
//   }
// };

// export { gameStatus };

const gameStatus = async (req, res) => {
  const { roomNumber } = req.query;

  if (!roomNumber) {
    return res.status(400).json({ error: "Room number is required" });
  }

  try {
    const [roomRows] = await db.query(
      "SELECT game_started FROM rooms WHERE room_number = ?",
      [roomNumber],
    );

    if (roomRows.length === 0) {
      return res.status(404).json({ error: "Room not found" });
    }

    res.status(200).json({
      success: true,
      gameStarted: roomRows[0].game_started,
    });
  } catch (error) {
    console.error("Error checking game status:", error);
    res.status(500).json({ error: "Failed to check game status" });
  }
};

export { gameStatus };
