const roomNumber = window.location.pathname.split("/")[2];

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById(
    "room-id-display",
  ).textContent = `Room ID: ${roomNumber}`;
});
