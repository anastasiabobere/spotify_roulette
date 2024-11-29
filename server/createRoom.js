import { db } from "./db.js";
const createRoom = async (req, res) => {
  const length = 4;
  const generateRandomString = (length) => {
    let text = "";
    const possible = "0123456789";
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

  const roomNumber = generateRandomString(length);

  try {
    const [result] = await db.query(
      "INSERT INTO rooms (room_number) VALUES (?)",
      [roomNumber],
    );

    if (result.affectedRows === 1) {
      res.status(201).json({ success: true, roomUrl: `/room/${roomNumber}` });
    } else {
      throw new Error("No rows affected");
    }
  } catch (error) {
    console.error("Error creating room:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown server error",
    });
  }
};
export { createRoom };
