console.log("works");
document.getElementById("createRoom").addEventListener("click", async () => {
  try {
    const response = await fetch("/create-room", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.success) {
      alert(`Room created successfully! Roomsss number: ${data.roomNumber}`);
      window.location.href = `/room.html/${data.roomNumber}`;
      //DOESNT WORK
      console.log(`${data.roomNumber}`);
    } else {
      alert("Error creating room.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
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
