// document.addEventListener("DOMContentLoaded", async () => {
//   const roomNumber = window.location.pathname.split("/")[2];
//   const roomIdDisplay = document.getElementById("room-id-display");
//   const playersContainer = document.querySelector(".players");

//   roomIdDisplay.textContent = `Room ID: ${roomNumber}`;

//   try {
//     // Fetch room data from the backend API
//     const response = await fetch(`/room/${roomNumber}/data`);
//     const result = await response.json();

//     if (!result.success) {
//       console.error("Room not found or server error:", result.message);
//       playersContainer.innerHTML = "<p>Room not found.</p>";
//       return;
//     }

//     const { host_id, participants } = result.data;

//     // Display host
//     const hostDiv = document.createElement("div");
//     hostDiv.classList.add("player");
//     hostDiv.textContent = `Host: ${host_id}`;
//     playersContainer.appendChild(hostDiv);

//     // Display participants list
//     participants.forEach((participant) => {
//       const participantDiv = document.createElement("div");
//       participantDiv.classList.add("player");
//       participantDiv.textContent = participant;
//       playersContainer.appendChild(participantDiv);
//     });
//   } catch (error) {
//     console.error("Error fetching room data:", error);
//     playersContainer.innerHTML = "<p>Failed to load room data.</p>";
//   }
// });

function startGame() {
  alert("Starting the game!");
}
