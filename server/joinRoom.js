import { db } from "./db.js";

const joinRoom = async (req, res) => {
  const { roomNumber } = req.body;
  try {
    //it doesnt fetch roomNumber
    console.log(roomNumber);

    const [rows] = await db.query("SELECT * FROM rooms WHERE room_number = ?", [
      roomNumber,
    ]);

    if (rows.length > 0) {
      res.status(200).json({ success: true, roomUrl: `/room/${roomNumber}` });
    } else {
      res.status(404).json({ success: false, message: "Room not found" });
    }
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown server error",
    });
  }
};

export { joinRoom };
