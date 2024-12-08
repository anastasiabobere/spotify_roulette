const roomNumber = window.location.pathname.split("/")[2];
document.getElementById(
  "room-id-display",
).textContent = `Room ID: ${roomNumber}`;
// Fetch room details (host_id and participants)
fetch(`/room/${roomNumber}`)
  .then((response) => response.json())
  .then((data) => {
    const hostIdElement = document.getElementById("host-id");
    const participantsListElement =
      document.getElementById("participants-list");

    // Set host ID
    hostIdElement.textContent = data.host_id || "Unknown Host ID";

    // Set participants IDs
    data.participants.forEach((participantId) => {
      const li = document.createElement("li");
      li.textContent = participantId;
      participantsListElement.appendChild(li);
    });
  })
  .catch((error) => {
    console.error("Error fetching room details:", error);
  });
