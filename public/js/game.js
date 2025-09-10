document.addEventListener("DOMContentLoaded", async () => {
  const roomNumber = window.location.pathname.split("/")[2];
  const songImage = document.getElementById("song-image");
  const songTitle = document.getElementById("song-title");
  const songArtist = document.getElementById("song-artist");
  const playersContainer = document.querySelector(".players");
  const nextBtn = document.getElementById("next-btn");
  const currentScoreEl = document.getElementById("current-score");
  const currentRoundEl = document.getElementById("current-round");
  let audioEl = null;

  const userData = JSON.parse(localStorage.getItem("userData"));
  const currentUserId = userData?.id?.toString();

  let players = [];
  let currentIndex = 0;
  let total = 10;

  async function loadPlayers() {
    try {
      const response = await fetch(`/api/room/${roomNumber}`);
      const data = await response.json();
      players = data.roomData?.participants || [];

      // If current user is not in participants, add them
      if (currentUserId && !players.includes(currentUserId)) {
        players.push(currentUserId);
      }

      // If current user is host, show Next button
      if (
        currentUserId &&
        data.roomData?.hosts_id?.toString() === currentUserId
      ) {
        nextBtn.style.display = "inline-block";
        nextBtn.onclick = nextSong;
      }
      renderPlayers(players, data);
    } catch (e) {
      console.error("Failed to load players", e);
    }
  }

  function renderPlayers(playerIds, roomDataResp) {
    playersContainer.innerHTML = "";
    // Show display names if room endpoint returned resolved names
    const displayNames = roomDataResp?.participants || [];
    const participantIds = roomDataResp?.roomData?.participants || [];

    playerIds.forEach((pid) => {
      const div = document.createElement("div");
      div.classList.add("player");
      div.dataset.userId = pid;

      // Find the display name for this player ID
      let displayName = pid; // fallback to ID
      const nameIndex = participantIds.indexOf(pid);
      if (nameIndex !== -1 && displayNames[nameIndex]) {
        displayName = displayNames[nameIndex];
      }

      div.innerHTML = `<h3>${displayName}</h3>`;
      div.addEventListener("click", () => submitGuess(pid, div));
      playersContainer.appendChild(div);
    });
  }

  async function fetchState() {
    try {
      const res = await fetch(`/api/game/state/${roomNumber}`);
      const state = await res.json();
      console.log("Game state:", state);
      if (!state.success) {
        console.error("Failed to fetch game state:", state.message);
        return;
      }
      currentIndex = state.currentIndex;
      total = state.total;
      const song = state.current;
      if (!song) {
        return showLeaderboard();
      }

      // Update UI
      songImage.src = song.cover || "img/default-cover.jpg";
      songTitle.textContent = song.name || "Guess the Song!";
      songArtist.textContent = song.artists || "";

      // Update round display
      currentRoundEl.textContent = currentIndex + 1;

      // Load current user's score
      await loadCurrentScore();

      // Setup preview playback if available
      if (audioEl) {
        try {
          audioEl.pause();
        } catch (_) {}
      }
      if (
        song.preview_url &&
        song.preview_url !== "null" &&
        song.preview_url !== ""
      ) {
        if (!audioEl) {
          audioEl = new Audio();
        }
        audioEl.src = song.preview_url;
        audioEl.volume = 0.7;
        // Try to play, but don't fail if autoplay is blocked
        audioEl.play().catch((err) => {
          console.log("Autoplay blocked or audio error:", err);
          // Show a play button or just continue without audio
        });
      } else {
        console.log("No preview URL available for this song");
      }
    } catch (error) {
      console.error("Error fetching game state:", error);
    }
  }

  async function submitGuess(guessedUserId, elem) {
    try {
      const res = await fetch(`/api/game/guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomNumber,
          userId: currentUserId,
          guessedUserId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.correct) {
          elem.classList.add("correct");
          // Update score display
          await loadCurrentScore();
        } else {
          elem.classList.add("incorrect");
        }
        setTimeout(() => {
          elem.classList.remove("correct", "incorrect");
        }, 2000);
      }
    } catch (e) {
      console.error("Failed to submit guess", e);
    }
  }

  async function loadCurrentScore() {
    try {
      const res = await fetch(`/api/game/leaderboard/${roomNumber}`);
      const data = await res.json();
      if (data.success) {
        const currentUserScore = data.leaderboard.find(
          (entry) => entry.user_id === currentUserId,
        );
        if (currentUserScore) {
          currentScoreEl.textContent = currentUserScore.score;
        }
      }
    } catch (e) {
      console.error("Failed to load score", e);
    }
  }

  async function nextSong() {
    const res = await fetch(`/api/game/next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomNumber }),
    });
    const data = await res.json();
    if (data.finished) {
      return showLeaderboard();
    }
    await fetchState();
  }

  async function showLeaderboard() {
    // Hide next button on leaderboard
    nextBtn.style.display = "none";

    const res = await fetch(`/api/game/leaderboard/${roomNumber}`);
    const data = await res.json();
    if (!data.success) return;

    // Get player names from room data
    let playerNames = {};
    try {
      const roomRes = await fetch(`/api/room/${roomNumber}`);
      const roomData = await roomRes.json();
      if (roomData.success) {
        const participantIds = roomData.roomData?.participants || [];
        const displayNames = roomData.participants || [];
        participantIds.forEach((id, idx) => {
          playerNames[id] = displayNames[idx] || id;
        });
      }
    } catch (e) {
      console.error("Failed to load player names:", e);
    }

    playersContainer.innerHTML = "";
    const title = document.createElement("h2");
    title.textContent = "Final Leaderboard";
    title.style.textAlign = "center";
    title.style.marginBottom = "2rem";
    playersContainer.appendChild(title);

    data.leaderboard.forEach((row, index) => {
      const div = document.createElement("div");
      div.classList.add("player");
      const displayName = playerNames[row.user_id] || row.user_id;
      const position = index + 1;
      div.innerHTML = `<h3>${position}. ${displayName}: ${row.score} points</h3>`;
      playersContainer.appendChild(div);
    });

    const again = document.createElement("button");
    again.classList.add("btn-green");
    again.textContent = "Play Again";
    again.style.marginTop = "2rem";
    again.onclick = async () => {
      try {
        const restartRes = await fetch(`/api/game/restart`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomNumber }),
        });

        if (!restartRes.ok) {
          throw new Error("Restart failed");
        }

        // Reset UI
        nextBtn.style.display = "inline-block";
        currentScoreEl.textContent = "0";
        currentRoundEl.textContent = "1";

        // Reload players and fetch new game state
        await loadPlayers();
        await fetchState();
      } catch (e) {
        console.error("Failed to restart game:", e);
        alert("Failed to restart game. Please try again.");
      }
    };
    playersContainer.appendChild(again);
  }

  // Host can press space to advance
  document.addEventListener("keydown", async (e) => {
    if (e.code === "Space" && nextBtn.style.display !== "none") {
      await nextSong();
    }
  });

  await loadPlayers();
  await fetchState();
});
