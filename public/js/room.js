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
