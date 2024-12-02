window.onload = async () => {
  const hash = window.location.hash;

  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken) {
      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);

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

        const timeRange = "long_term";
        const limit = 30;

        try {
          const response = await fetch(
            `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
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
          const topTracksList = document.getElementById("top-tracks");
          topTracksList.innerHTML = "";
          tracks.forEach((track) => {
            const trackElement = document.createElement("li");
            trackElement.textContent = `${track.name} by ${track.artists
              .map((artist) => artist.name)
              .join(", ")}`;
            topTracksList.appendChild(trackElement);
          });
        } catch (error) {
          console.error("Error fetching top tracks:", error);
        }

        const userId = userData.id;
        console.log("User ID:", userId);

        document.getElementById("user-name").textContent =
          userData.display_name || "No Display Name";

        if (userData.images && userData.images.length > 0) {
          const img = document.getElementById("profile-pic");
          img.src = userData.images[0].url;
          img.style.display = "block";
          img.style.zIndex = "10";
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    } else {
      console.error("No access token found");
    }

    window.location.hash = "";
  } else {
    console.log("No hash present in the URL");
  }
};
