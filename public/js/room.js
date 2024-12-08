document.addEventListener("DOMContentLoaded", async () => {
  const roomNumber = window.location.pathname.split("/")[2];
  document.getElementById(
    "room-id-display",
  ).textContent = `Room ID: ${roomNumber}`;

  try {
    const response = await fetch(`/room/${roomNumber}`);
    if (!response.ok) {
      throw new Error(`Error fetching room details: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Unknown error loading room details");
    }

    const { host_id, participants } = data;

    const playersDiv = document.querySelector(".players");
    playersDiv.innerHTML = "";

    const hostElement = document.createElement("div");
    hostElement.classList.add("player");
    hostElement.textContent = host;
    playersDiv.appendChild(hostElement);

    participants.forEach((participant) => {
      const playerElement = document.createElement("div");
      playerElement.classList.add("player");
      playerElement.textContent = participant;
      playersDiv.appendChild(playerElement);
    });
  } catch (error) {
    console.error("Error fetching room details:", error);
    // Handle error, e.g., display an error message to the user
  }
});
