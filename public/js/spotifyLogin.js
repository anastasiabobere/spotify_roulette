window.onload = async () => {
  // console.log("Access :" + accessToken);
  const hash = window.location.hash;

  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);

      try {
        const userResponse = await fetch("https://api.spotify.com/v1/me", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!userResponse.ok) {
          console.log("Access :" + accessToken);
          console.error("Failed fetch response:", await userResponse.text()); // Log full response text
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
    const accessToken = localStorage.getItem("accessToken");

    if (storedUserData && accessToken) {
      console.log("Loaded user data from localStorage:", storedUserData);
      updateUserProfileUI(storedUserData);
    } else {
      console.log("No user data found in localStorage");
    }

    const storedTopTracks = getStoredTopTracks();
    if (storedTopTracks) {
      console.log("Loaded top tracks from localStorage:", storedTopTracks);
      displayTopTracks(storedTopTracks);
    }
  }

  const loginButton = document.getElementById("login-btn");
  const logoutButton = document.getElementById("logout-btn");

  const accessToken = localStorage.getItem("accessToken");

  if (accessToken) {
    loginButton.style.display = "none";
    logoutButton.style.display = "block";

    logoutButton.addEventListener("click", () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userData");
      localStorage.removeItem("topTracks");
      document.cookie =
        "spotify_auth_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.reload();
      console.log("Current Access Token:", localStorage.getItem("accessToken"));
    });
  } else {
    loginButton.style.display = "block";
    logoutButton.style.display = "none";
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

    localStorage.setItem("topTracks", JSON.stringify(tracks));

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
