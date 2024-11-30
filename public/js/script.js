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
  // Fetch the input value
  console.log("Room Number to join:", roomNumber); // Debugging client-side

  try {
    const response = await fetch("/join-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ roomNumber }), // Send roomNumber as JSON
    });

    const data = await response.json();
    console.log("Server response:", data); // Debugging server response

    if (data.success) {
      window.location.href = data.roomUrl;
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error("Error in joinRoom fetch:", error);
  }
});
