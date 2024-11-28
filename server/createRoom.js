import db from "./db.js";

// const generateRandomRoomNumber = () => {
//   const length = 4;
//   let text = "";
//   const possible = "0123456789";
//   for (let i = 0; i < length; i++) {
//     text += possible.charAt(Math.floor(Math.random() * possible.length));
//   }
//   return text;
// };

// const createRoom = async (req, res) => {
//   try {
//     let roomNumber = generateRandomRoomNumber();

//     let isUnique = false;
//     while (!isUnique) {
//       const [rows] = await db.execute(
//         "SELECT * FROM rooms WHERE room_number = ?",
//         [roomNumber],
//       );
//       if (rows.length === 0) {
//         isUnique = true;
//       } else {
//         roomNumber = generateRandomRoomNumber();
//       }
//     }

//     const [result] = await db.execute(
//       "INSERT INTO rooms (room_number) VALUES (?)",
//       [roomNumber],
//     );
//     res.json({
//       success: true,
//       message: "Room created successfully",
//       roomNumber,
//       roomId: result.insertId,
//     });
//   } catch (error) {
//     console.error(error);
//     console.error("Database Error:", error.message);
//     console.error("Error Details:", error);

//     res.status(500).json({ success: false, message: "Error creating room." });
//   }
// };

// export { createRoom };
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
    console.error("Error creating room:", error); // Log the actual error
    res.status(500).json({
      success: false,
      message: error.message || "Unknown server error",
    });
  }
};
export { createRoom };
