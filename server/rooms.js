import db from "./db.js"; // Import database connection

const generateRandomRoomNumber = () => {
  const length = 4;
  let text = "";
  const possible = "0123456789";
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const createRoom = async (req, res) => {
  try {
    let roomNumber = generateRandomRoomNumber();

    let isUnique = false;
    while (!isUnique) {
      const [rows] = await db.execute(
        "SELECT * FROM rooms WHERE room_number = ?",
        [roomNumber],
      );
      if (rows.length === 0) {
        isUnique = true;
      } else {
        roomNumber = generateRandomRoomNumber();
      }
    }

    const [result] = await db.execute(
      "INSERT INTO rooms (room_number) VALUES (?)",
      [roomNumber],
    );
    res.json({
      success: true,
      message: "Room created successfully",
      roomNumber,
      roomId: result.insertId,
    });
  } catch (error) {
    console.error(error);
    console.error("Database Error:", error.message); // Log the error message
    console.error("Error Details:", error); // Log the full error object for debugging

    res.status(500).json({ success: false, message: "Error creating room." });
  }
};

export { createRoom };
