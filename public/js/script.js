const userData = JSON.parse(localStorage.getItem("userData"));

document.getElementById("createRoom").addEventListener("click", async () => {
  if (!userData) {
    alert("Login to spotify first");
  } else {
    hostID = userData.id;
    console.log(userData.id);
    fetch("/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hostID }),
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
  }
});
document.getElementById("joinRoom").addEventListener("click", async () => {
  const roomNumber = document.getElementById("joinRoomInput").value;
  if (!userData) {
    alert("Login to spotify first");
  } else {
    const userID = userData.id;
    console.log("Room Number to join:", roomNumber);

    try {
      const response = await fetch("/join-room", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomNumber, userID }),
      });

      const data = await response.json();
      console.log("Server response:", data);
      if (data.success) {
        window.location.href = data.roomUrl;
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error in joinRoom fetch:", error);
    }
  }
});
document.getElementById("show").addEventListener("click", function () {
  const topTracks = document.getElementById("top-tracks");

  if (topTracks.style.opacity === "1") {
    topTracks.style.opacity = "0";
    this.textContent = "Show Top Tracks";
  } else {
    topTracks.style.opacity = "1";
    this.textContent = "Hide Top Tracks";
  }
});
