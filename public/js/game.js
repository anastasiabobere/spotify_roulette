document.addEventListener("DOMContentLoaded", async () => {
  const roomNumber = window.location.pathname.split("/")[2];
  const songImage = document.getElementById("song-image");
  const songTitle = document.getElementById("song-title");
  const songArtist = document.getElementById("song-artist");
  const timerEl = document.getElementById("round-timer");
  const playersContainer = document.querySelector(".players");
  const nextBtn = document.getElementById("next-btn");
  const currentScoreEl = document.getElementById("current-score");
  const currentRoundEl = document.getElementById("current-round");
  let audioEl = null;

  const userData = JSON.parse(localStorage.getItem("userData") || "null");
  const currentUserId = userData?.id?.toString();

  let players = [];
  let currentIndex = -1;
  let total = 10;
  let pollInterval = null;
  let latestNameMap = {}; // id -> displayName
  let guessedThisRound = new Set();
  let roundTimer = null;
  let remaining = 0;
  const audio = new Audio(song.preview_url);
  audio.play();

  setTimeout(() => {
    audio.pause();
  }, 10000); // stop after 10s

  async function loadPlayers() {
    try {
      const response = await fetch(`/api/room/${roomNumber}`);
      const data = await response.json();
      const serverIds = data.roomData?.participants || [];
      const serverNames = data.participants || [];
      const hostId = data.roomData?.hosts_id?.toString() || null;
      const hostNameFromServer = data.hostName || null;

      const nameMap = {};
      serverIds.forEach((id, i) => {
        const sid = id?.toString();
        const nameCandidate = serverNames[i];
        if (sid) {
          if (nameCandidate && nameCandidate !== sid)
            nameMap[sid] = nameCandidate;
        }
      });
      if (hostId && hostNameFromServer && hostNameFromServer !== hostId)
        nameMap[hostId] = hostNameFromServer;
      latestNameMap = nameMap;

      // Use participants from server (already includes host and joined players)
      players = Array.from(new Set([...(serverIds || []).map(String)]));

      // host controls
      if (currentUserId && hostId && hostId === currentUserId) {
        nextBtn.style.display = "inline-block";
        nextBtn.onclick = nextSong;
        ensureStartButton();
      } else {
        nextBtn.style.display = "none";
        removeStartButton();
      }

      renderPlayers(players, { nameMap, hostId });
    } catch (e) {
      console.error("Failed to load players", e);
    }
  }

  function renderPlayers(playerIds, extra = {}) {
    playersContainer.innerHTML = "";
    const nameMap = extra.nameMap || latestNameMap || {};
    const hostId = extra.hostId;
    playerIds.forEach((pid) => {
      const id = pid?.toString();
      const div = document.createElement("div");
      div.classList.add("player");
      div.dataset.userId = id;
      const displayName = nameMap[id] || id;
      const isHost = hostId && id === hostId;
      div.innerHTML = `<h3>${isHost ? "👑 " : ""}${escapeHtml(
        displayName,
      )}</h3>`;
      div.addEventListener("click", () => handlePlayerClick(id, div));
      playersContainer.appendChild(div);
    });
  }

  function escapeHtml(text) {
    if (typeof text !== "string") return text;
    return text.replace(
      /[&<>"']/g,
      (m) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[m]),
    );
  }

  async function fetchState() {
    try {
      const res = await fetch(`/api/game/state/${roomNumber}`);
      const state = await res.json();
      if (!state.success) return;
      // detect song change
      if (state.currentIndex !== currentIndex) {
        currentIndex = state.currentIndex;
        total = state.total;
        guessedThisRound.clear();
        // update UI and start round timer/play audio
        setupRound(state.current);
      }
      // always update round number display and score
      currentRoundEl.textContent = currentIndex + 1;
      await loadCurrentScore();
    } catch (error) {
      console.error("Error fetching game state:", error);
    }
  }

  function setupRound(song) {
    if (!song) {
      showLeaderboard();
      return;
    }
    songImage.src = song.cover || "img/default-cover.jpg";
    songTitle.textContent = song.name || "Guess the Song!";
    songArtist.textContent = song.artists || "";
    // show owner as id in dev, but names come from latestNameMap
    const ownerName = latestNameMap[song.ownerId] || song.ownerId;
    // prepare audio
    stopAudio();
    if (song.preview_url && song.preview_url !== "") {
      audioEl = new Audio(song.preview_url);
      audioEl.volume = 0.8;
      audioEl.play().catch(() => {
        ensureManualPlayButton();
      });
    } else if (song.trackId) {
      // fallback: show spotify embed (user can press play)
      showSpotifyEmbed(song.trackId);
    }
    startRoundTimer(10); // 10 seconds
  }

  function startRoundTimer(seconds) {
    stopRoundTimer();
    remaining = seconds;
    updateTimerText();
    roundTimer = setInterval(() => {
      remaining -= 1;
      updateTimerText();
      if (remaining <= 0) {
        stopRoundTimer();
        // disable further guessing
        guessedThisRound.clear(); // keep for server, but disable clicking by setting flag
        // host auto-advance
        attemptAutoAdvance();
      }
    }, 1000);
  }

  function stopRoundTimer() {
    if (roundTimer) {
      clearInterval(roundTimer);
      roundTimer = null;
    }
  }

  function updateTimerText() {
    if (!timerEl) return;
    timerEl.textContent =
      remaining > 0 ? `Time left: ${remaining}s` : "Time's up";
  }

  function stopAudio() {
    if (audioEl) {
      try {
        audioEl.pause();
      } catch (_) {}
      audioEl = null;
    }
    removeSpotifyEmbed();
  }

  function showSpotifyEmbed(trackId) {
    removeSpotifyEmbed();
    const container = document.getElementById("spotify-embed");
    if (!container) return;
    const iframe = document.createElement("iframe");
    iframe.src = `https://open.spotify.com/embed/track/${trackId}`;
    iframe.width = "300";
    iframe.height = "80";
    iframe.frameBorder = "0";
    iframe.allow =
      "autoplay; clipboard-write; encrypted-media; picture-in-picture";
    container.appendChild(iframe);
  }

  function removeSpotifyEmbed() {
    const container = document.getElementById("spotify-embed");
    if (!container) return;
    container.innerHTML = "";
  }

  function ensureManualPlayButton() {
    const existing = document.getElementById("play-audio-btn");
    if (existing) return;
    const btn = document.createElement("button");
    btn.id = "play-audio-btn";
    btn.className = "btn-green";
    btn.textContent = "Play Preview";
    btn.style.margin = "0.5rem 0";
    btn.onclick = () => {
      try {
        if (audioEl) audioEl.play().catch(() => {});
        const embed = document.querySelector("#spotify-embed iframe");
        if (embed)
          embed.contentWindow?.postMessage?.(
            '{"event":"command","func":"play"}',
            "*",
          );
      } catch (_) {}
    };
    const container = document.querySelector(".players").parentNode;
    container.insertBefore(btn, document.querySelector(".players"));
  }

  function removeManualPlayButton() {
    const existing = document.getElementById("play-audio-btn");
    if (existing) existing.remove();
  }

  function handlePlayerClick(targetId, elem) {
    // prevent guessing for self
    if (currentUserId === targetId) {
      alert("You cannot guess yourself.");
      return;
    }
    // prevent double guess in same round
    if (guessedThisRound.has(currentUserId)) {
      alert("You have already guessed this round.");
      return;
    }
    submitGuess(targetId, elem);
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
      if (!data.success) {
        if (data.message) alert(data.message);
        return;
      }
      guessedThisRound.add(currentUserId);
      if (data.correct) {
        elem.classList.add("correct");
        await loadCurrentScore();
      } else if (data.alreadyAnswered) {
        elem.classList.add("incorrect");
      } else {
        elem.classList.add("incorrect");
      }
      setTimeout(() => elem.classList.remove("correct", "incorrect"), 1500);
    } catch (e) {
      console.error("Failed to submit guess", e);
    }
  }

  async function loadCurrentScore() {
    try {
      const res = await fetch(`/api/game/leaderboard/${roomNumber}`);
      const data = await res.json();
      if (data.success) {
        const entry = data.leaderboard.find(
          (e) => e.user_id?.toString() === currentUserId,
        );
        if (entry) currentScoreEl.textContent = entry.score;
      }
    } catch (e) {
      console.error("Failed to load score", e);
    }
  }

  async function nextSong() {
    try {
      const res = await fetch(`/api/game/next`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber }),
      });
      const data = await res.json();
      if (data.finished) return showLeaderboard();
      await fetchState();
    } catch (e) {
      console.error("Failed to advance song", e);
    }
  }

  async function attemptAutoAdvance() {
    // only host should auto-advance; check host via /api/room
    try {
      const roomRes = await fetch(`/api/room/${roomNumber}`);
      const roomData = await roomRes.json();
      const hostId = roomData.roomData?.hosts_id?.toString();
      if (hostId && currentUserId === hostId) {
        await nextSong();
      }
    } catch (e) {
      // ignore
    }
  }

  // Start game (client side start button calls /start-game)
  async function startGame() {
    try {
      const res = await fetch(`/start-game`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomNumber }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to start");
      // navigate to game page if server asked
      if (data.redirectUrl) window.location.href = data.redirectUrl;
      await fetchState();
      startPolling();
    } catch (e) {
      console.error("Failed to start game", e);
      alert("Failed to start game. Check console.");
    }
  }

  function ensureStartButton() {
    if (document.getElementById("start-game-btn")) return;
    const startBtn = document.createElement("button");
    startBtn.id = "start-game-btn";
    startBtn.className = "btn-green";
    startBtn.textContent = "Start Game";
    startBtn.style.marginRight = "0.5rem";
    startBtn.onclick = startGame;
    playersContainer.parentNode.insertBefore(startBtn, playersContainer);
  }

  function removeStartButton() {
    const b = document.getElementById("start-game-btn");
    if (b) b.remove();
  }

  async function showLeaderboard() {
    stopPolling();
    stopRoundTimer();
    removeManualPlayButton();
    const res = await fetch(`/api/game/leaderboard/${roomNumber}`);
    const data = await res.json();
    if (!data.success) return;
    // get name map
    try {
      const roomRes = await fetch(`/api/room/${roomNumber}`);
      const roomData = await roomRes.json();
      const ids = roomData.roomData?.participants || [];
      const names = roomData.participants || [];
      ids.forEach((id, idx) => {
        latestNameMap[id?.toString()] = names[idx] || id;
      });
    } catch (e) {}
    playersContainer.innerHTML = "";
    const title = document.createElement("h2");
    title.textContent = "Final Leaderboard";
    title.style.textAlign = "center";
    title.style.marginBottom = "2rem";
    playersContainer.appendChild(title);
    data.leaderboard.forEach((row, index) => {
      const div = document.createElement("div");
      div.classList.add("player");
      const displayName = latestNameMap[row.user_id?.toString()] || row.user_id;
      div.innerHTML = `<h3>${index + 1}. ${escapeHtml(displayName)}: ${
        row.score
      } points</h3>`;
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
        if (!restartRes.ok) throw new Error("Restart failed");
        await loadPlayers();
        await fetchState();
        startPolling();
      } catch (e) {
        console.error("Failed to restart game:", e);
        alert("Failed to restart game. Please try again.");
      }
    };
    playersContainer.appendChild(again);
  }

  function startPolling() {
    if (pollInterval) return;
    pollInterval = setInterval(fetchState, 2500);
  }

  function stopPolling() {
    if (!pollInterval) return;
    clearInterval(pollInterval);
    pollInterval = null;
  }

  document.addEventListener("keydown", async (e) => {
    if (e.code === "Space" && nextBtn.style.display !== "none") {
      await nextSong();
    }
  });

  // initial load
  await loadPlayers();
  await fetchState();
  startPolling();
});
