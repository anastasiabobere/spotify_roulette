window.onload = async () => {
  const hash = window.location.hash;
  //ERROR WITH HASG
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (accessToken) {
      console.log("Access Token:", accessToken);
      console.log("Refresh Token:", refreshToken);

      const userId = "your_user_id"; // Replace with the actual Spotify User ID you want to fetch

      // Fetch user data by ID
      try {
        const userResponse = await fetch(
          `https://api.spotify.com/v1/users/${userId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );

        if (!userResponse.ok) {
          throw new Error(
            `Failed to fetch user profile: ${userResponse.statusText}`,
          );
        }

        const userData = await userResponse.json();

        // Update DOM with user data
        document.getElementById("user-name").textContent =
          userData.display_name;
        if (userData.images && userData.images.length > 0) {
          const img = document.getElementById("profile-pic");
          img.src = userData.images[0].url;
          img.style.display = "block";
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    } else {
      console.error("No access token found");
    }

    // Remove hash from URL
    window.location.hash = "";
  } else {
    console.log("hello");
  }
};
