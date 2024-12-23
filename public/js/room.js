// const startGame = async (roomNumber) => {
//   try {
//     const response = await fetch("/api/start-game", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ roomNumber }),
//     });

//     if (response.ok) {
//       console.log("Game started!");
//     } else {
//       const error = await response.json();
//       console.error("Error starting game:", error.message);
//     }
//   } catch (err) {
//     console.error("Error starting game:", err);
//   }
// };

// document.getElementById("start-game-btn").addEventListener("click", () => {
//   const roomNumber = window.location.pathname.split("/")[2];
//   startGame(roomNumber);
// });
const roomNumber = window.location.pathname.split("/")[2];
const checkGameStatus = async (roomNumber) => {
  try {
    const response = await fetch(`/game-status?roomNumber=${roomNumber}`);
    const data = await response.json();

    if (data.success && data.gameStarted) {
      window.location.href = "/game.html";
    }
  } catch (error) {
    console.error("Error checking game status:", error);
  }
};

const startPolling = (roomNumber) => {
  setInterval(() => checkGameStatus(roomNumber), 3000);
};

// Assume `roomNumber` is globally available
startPolling(roomNumber);
