window.onload = async () => {
  const hash = window.location.hash;

  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");

    if (accessToken) {
      console.log("Access Token:", accessToken);

      try {
        const userResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
          throw new Error(
            `Failed to fetch user profile: ${userResponse.statusText}`,
          );
        }

        const userData = await userResponse.json();
        console.log("User Data:", userData);

        localStorage.setItem("userData", JSON.stringify(userData));

        updateUserProfileUI(userData);

        await fetchAndDisplayTopTracks(accessToken);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    } else {
      console.error("No access token found");
    }
  } else {
    console.log("No hash present in the URL");

    const storedUserData = getStoredUserData();
    if (storedUserData) {
      console.log("Loaded user data from localStorage:", storedUserData);
      updateUserProfileUI(storedUserData);
      document.getElementById("login-btn").textContent = "Log Out";
      document
        .getElementById("login-btn")
        .addEventListener("click", function () {
          localStorage.removeItem("userData");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("topTracks");
          window.location.reload();
        });
    } else {
      console.log("No user data found in localStorage");
    }

    const storedTopTracks = getStoredTopTracks();
    if (storedTopTracks) {
      console.log("Loaded top tracks from localStorage:", storedTopTracks);
      displayTopTracks(storedTopTracks);
    }
  }
  window.location.hash = "";
};

async function fetchAndDisplayTopTracks(accessToken) {
  const timeRange = "long_term";
  const limit = 30;

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch top tracks: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    console.log("User's Top Tracks:", data);

    const tracks = data.items;

    // Store top tracks in localStorage
    localStorage.setItem("topTracks", JSON.stringify(tracks));

    // Display top tracks
    displayTopTracks(tracks);
  } catch (error) {
    console.error("Error fetching top tracks:", error);
  }
}

function displayTopTracks(tracks) {
  const topTracksList = document.getElementById("top-tracks");
  topTracksList.innerHTML = "";

  tracks.forEach((track) => {
    const trackElement = document.createElement("li");
    trackElement.textContent = `${track.name} by ${track.artists
      .map((artist) => artist.name)
      .join(", ")}`;
    topTracksList.appendChild(trackElement);
  });
}

function updateUserProfileUI(userData) {
  document.getElementById("user-name").textContent =
    userData.display_name || "No Display Name";
}

function getStoredUserData() {
  const data = localStorage.getItem("userData");
  return data ? JSON.parse(data) : null;
}

function getStoredTopTracks() {
  const data = localStorage.getItem("topTracks");
  return data ? JSON.parse(data) : null;
}
