import { db } from "./db.js";

const getRoomDetails = async (req, res) => {
  const { roomNumber } = req.params;

  console.log(roomNumber);

  try {
    const [room] = await db.query(
      "SELECT host_id, participants FROM rooms WHERE room_number = ?",
      [roomNumber],
    );

    if (room.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
      });
    }

    const roomDetails = room[0];
    let participants = [];
    try {
      participants = roomDetails.participants
        ? JSON.parse(roomDetails.participants)
        : [];
    } catch (parseError) {
      console.error("Error parsing participants JSON:", parseError);
      participants = [];
    }

    res.status(200).json({
      success: true,
      data: {
        roomNumber: roomDetails.room_number,
        host_id: roomDetails.host_id,
        participants: participants,
      },
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Unknown server error",
    });
  }
};

export { getRoomDetails };
