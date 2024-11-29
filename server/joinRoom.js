import { db } from "./db.js";
const joinRoom = async (req, res) => {
  const { roomNumber } = req.body;

  try {
    const [rows] = await db
      .promise()
      .query("SELECT * FROM rooms WHERE room_number = ?", [roomNumber]);

    if (rows.length > 0) {
      // Room exists
      res.status(200).json({ success: true, message: "Room found!" });
    } else {
      res.status(404).json({
        success: false,
        message: "Room not found. Please check the number and try again.",
      });
    }
  } catch (error) {
    console.error("Error joining room:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

export { joinRoom };
