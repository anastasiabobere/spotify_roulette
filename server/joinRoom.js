import { db } from "./db.js";

const joinRoom = async (req, res) => {
  const { roomNumber, userID } = req.body;

  // Validate required inputs
  if (!roomNumber || !userID) {
    return res.status(400).json({
      success: false,
      message: "Room number and user ID are required.",
    });
  }

  try {
    // Fetch room details from the database
    const query = "SELECT * FROM rooms WHERE room_number = ?";
    const [rows] = await db.query(query, [roomNumber]);

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Room not found." });
    }

    const room = rows[0];
    let participants;

    try {
      // Parse participants, default to an empty array if parsing fails
      participants = room.participants ? JSON.parse(room.participants) : [];
      if (!Array.isArray(participants)) {
        console.error("Invalid participants format:", participants);
        participants = [];
      }
    } catch (parseError) {
      console.error("Failed to parse participants field:", room.participants);
      participants = [];
    }

    // Ensure userID is treated as a string
    const userIDString = userID.toString();

    // Add user to the participants list if not already present
    if (!participants.includes(userIDString)) {
      participants.push(userIDString);

      // Update the participants field in the database
      const updateQuery =
        "UPDATE rooms SET participants = ? WHERE room_number = ?";
      await db.query(updateQuery, [JSON.stringify(participants), roomNumber]);

      console.log(
        `User ${userIDString} successfully joined room ${roomNumber}`,
      );
    } else {
      console.log(`User ${userIDString} is already in room ${roomNumber}`);
    }

    // Respond with the room URL
    res.status(200).json({
      success: true,
      roomUrl: `/room/${roomNumber}`,
    });
  } catch (error) {
    console.error("Error in joinRoom function:", error);
    res.status(500).json({
      success: false,
      message: error.message || "An unexpected server error occurred.",
    });
  }
};

export { joinRoom };
