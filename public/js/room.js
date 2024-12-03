const roomNumber = window.location.pathname.split("/")[2];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById(
    "room-id-display",
  ).textContent = `Room ID: ${roomNumber}`;

  const userData = JSON.parse(localStorage.getItem("userData"));
  if (!userData) {
    console.error("User data not found in localStorage");
    return;
  }

  console.log(userData);

  const playersDiv = document.querySelector(".players"); // Select the first element with the class "players"
  if (!playersDiv) {
    console.error("Players container not found");
    return;
  }

  // Create the player div
  const player = document.createElement("div");
  player.classList.add("player");
  const h3 = document.createElement("h3");
  h3.textContent = userData.display_name || "Unnamed Player";
  player.appendChild(h3);
  playersDiv.appendChild(player);
});
