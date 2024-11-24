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
      alert(`Room created successfully! Room number: ${data.roomNumber}`);
    } else {
      alert("Error creating room.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
});
