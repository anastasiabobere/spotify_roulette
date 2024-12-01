import { db } from "./db.js";

const joinRoom = async (req, res) => {
  const { roomNumber } = req.body;

  console.log("Received roomNumber from request:", roomNumber); // Debugging input

  try {
    const query = "SELECT * FROM rooms WHERE room_number = ?";
    console.log("Executing query:", query, "with value:", roomNumber); // Debugging SQL

    const [rows] = await db.query(query, [roomNumber]);

    console.log("Query result:", rows); // Debugging query result

    if (rows.length > 0) {
      res.status(200).json({ success: true, roomUrl: `/room/${roomNumber}` });
    } else {
      res.status(404).json({ success: false, message: "Room not found" });
    }
  } catch (error) {
    console.error("Error in joinRoom function:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown server error",
    });
  }
};

export { joinRoom };
