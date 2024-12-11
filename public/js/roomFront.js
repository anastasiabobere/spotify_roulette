window.addEventListener("DOMContentLoaded", async () => {
  const roomNumber = window.location.pathname.split("/")[2];
  const roomIdDisplay = document.getElementById("room-id-display");
  const participantsListElement = document.getElementById("participants");
  roomIdDisplay.textContent = `Room ID: ${roomNumber}`;
  try {
    const response = await fetch(`/room/${roomNumber}`);
    if (!response.ok) throw new Error("Failed to fetch room data");

    const { host_id, participants, spotifyNames } = await response.json();

    // Display host
    const hostDiv = document.createElement("div");
    hostDiv.classList.add("player");
    hostDiv.innerHTML = `<h3>${host_id} (Host)</h3>`;
    participantsListElement.appendChild(hostDiv);

    // Display participants
    spotifyNames.forEach((name) => {
      const div = document.createElement("div");
      div.classList.add("player");
      div.innerHTML = `<h3>${name}</h3>`;
      participantsListElement.appendChild(div);
    });
  } catch (error) {
    console.error("Error loading room data:", error);
  }
});

// Start the game
window.startGame = async () => {
  const roomNumber = window.location.pathname.split("/")[2];
  try {
    const response = await fetch(`/room/${roomNumber}/start-game`, {
      method: "POST",
    });

    if (response.ok) {
      alert("Game started!");
    } else {
      alert("Failed to start the game.");
    }
  } catch (error) {
    console.error("Error starting the game:", error);
    alert("An error occurred.");
  }
};
