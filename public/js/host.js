const startGame = async (roomNumber) => {
  try {
    const response = await fetch("/start-game", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber }),
    });

    const data = await response.json();
    if (data.success) {
      console.log("Game started successfully!");
    } else {
      console.error("Failed to start game:", data.error);
    }
  } catch (error) {
    console.error("Error starting game:", error);
  }
};

const startGameButton = document.getElementById("start-game-btn");
startGameButton.addEventListener("click", () => {
  startGame(roomNumber);
});
