console.log("works");
document.getElementById("createRoom").addEventListener("click", async () => {
  fetch("/create-room", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        window.location.href = data.roomUrl;
      } else {
        console.error("Room creation failed:", data.message);
        alert(data.message || "Failed to create room. Please try again.");
      }
    })
    .catch((error) => {
      console.error("Error in fetch:", error);
      alert("Error connecting to server. Please try again.");
    });
});

document.getElementById("joinRoom").addEventListener("click", async () => {
  const roomNumber = document.getElementById("joinRoomInput").value;

  try {
    const response = await fetch("/join-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomNumber }),
    });

    const result = await response.json();

    if (result.success) {
      // Redirect to the room or display a success message
      alert("Joined room successfully!");
      // window.location.href = `/room/${roomNumber}`;
    } else {
      // Display error
      alert(result.message);
    }
  } catch (error) {
    console.error("Error joining room:", error);
    alert("An error occurred. Please try again.");
  }
});
