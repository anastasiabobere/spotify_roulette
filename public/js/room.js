const roomNumber = window.location.pathname.split("/")[2];
document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById(
    "room-id-display",
  ).textContent = `Room ID: ${roomNumber}`;

  try {
    // Fetch room details from the server
    const response = await fetch(`/room/${roomNumber}/details`);
    const data = await response.json();

    if (!data.success) {
      console.error("Failed to fetch room details:", data.message);
      return;
    }

    const { host, participants } = data;

    const playersDiv = document.querySelector(".players");
    if (!playersDiv) {
      console.error("Players container not found");
      return;
    }

    // Add Host to Players List
    const hostDiv = document.createElement("div");
    hostDiv.classList.add("player");
    const hostHeading = document.createElement("h3");
    hostHeading.textContent = `Host: ${host.display_name || "Unknown Host"}`;
    hostDiv.appendChild(hostHeading);
    playersDiv.appendChild(hostDiv);

    // Add Participants to Players List
    participants.forEach((participant) => {
      const participantDiv = document.createElement("div");
      participantDiv.classList.add("player");
      const participantHeading = document.createElement("h3");
      participantHeading.textContent = `Player: ${
        participant.display_name || "Unknown Player"
      }`;
      participantDiv.appendChild(participantHeading);
      playersDiv.appendChild(participantDiv);
    });
  } catch (error) {
    console.error("Error loading room details:", error);
  }
});
