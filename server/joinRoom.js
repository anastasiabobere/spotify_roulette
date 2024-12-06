import { db } from "./db.js";

const joinRoom = async (req, res) => {
  const { roomNumber, userID } = req.body;

  if (!roomNumber || !userID) {
    return res.status(400).json({
      success: false,
      message: "Room number and user ID are required",
    });
  }

  try {
    // Fetch the room data
    const query = "SELECT * FROM rooms WHERE room_number = ?";
    const [rows] = await db.query(query, [roomNumber]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found" });
    }

    // Parse current participants
    const room = rows[0];
    let participants = JSON.parse(room.participants || "[]");

    // Check if the user is already a participant
    if (!participants.includes(userID)) {
      participants.push(userID);

      // Update the participants column in the database
      const updateQuery =
        "UPDATE rooms SET participants = ? WHERE room_number = ?";
      await db.query(updateQuery, [JSON.stringify(participants), roomNumber]);

      console.log(`User ${userID} joined room ${roomNumber}`);
    }

    res.status(200).json({ success: true, roomUrl: `/room/${roomNumber}` });
  } catch (error) {
    console.error("Error in joinRoom function:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown server error",
    });
  }
};

export { joinRoom };
