// ──────────────── DOM ELEMENTS ────────────────
const navBtns = document.querySelectorAll("nav button");
const sections = document.querySelectorAll(".main section");
const addSongBtn = document.getElementById("addSongBtn");
const songFile = document.getElementById("songFile");
const empty = document.querySelector(".empty");
const songsList = document.querySelector(".songs-list");
const favoritesList = document.querySelector(".favorites-list");

const player = document.querySelector(".player-container");
const playerTitle = player.querySelector(".player-song-info h3");
const playerArtist = player.querySelector(".player-song-info p");
const currentTimeEle = player.querySelector(".current-time");
const totalTimeEle = player.querySelector(".total-time");
const songCover = document.querySelector(".song-cover");
const downPlayer = document.getElementById("downPlayer");

const volumeContainer = document.querySelector(".volume");
const showVolumeBtn = document.getElementById("controlVolume");
const volumeBar = document.getElementById("volumeBar");

const progressInput = document.querySelector(".progress-bar input");
const randomSongBtn = document.getElementById("randomSong");
const previousSongBtn = document.getElementById("previousSong");
const playPauseBtn = document.getElementById("pauseSong");
const nextSongBtn = document.getElementById("nextSong");
const repeatBtn = document.getElementById("repeatSong");

const summary = document.querySelector(".summary");
const summaryCover = document.getElementById("summaryCover");
const summaryTitle = document.getElementById("summaryTitle");
const summaryArtist = document.getElementById("summaryArtist");
const summaryPlayPauseBtn = document.getElementById("summaryPauseSong");

const searchInput = document.getElementById("findSong");
const searchList = document.querySelector(".search-list");

// ──────────────── INITIAL VARIABLES ────────────────
let allSongs = [];
let currentIndex = 0;
let isRepeatOn = false;
let currentTimeListener = null;

// ──────────────── HELPER FUNCTIONS ────────────────

// Convert seconds to mm:ss format
function formatDuration(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? "0" : ""}${sec}`;
}

// Setup progress bar value
function setUpProgressBar(percent) {
  progressInput.value = Math.floor(percent);
}

// Update the background of progress or volume bars
function updateBarBg(input, percent, color = "var(--main-color)") {
  input.style.background = `linear-gradient(to right, ${color} ${percent}%, rgba(255,255,255,0.1) ${percent}%)`;
}

// ──────────────── UI – DISPLAY SONGS ────────────────
function displaySongs(list, container) {
  container.innerHTML = "";

  list.forEach((song) => {
    const li = document.createElement("li");
    li.classList.add("song");
    li.classList.toggle("playing", song.playing);

    li.innerHTML = `
      <div class="song-info" title="${song.songName}">
        <img src="${song.cover}" alt="cover">
      <div>
      <div class="song-name">${song.songName}</div>
        <small>${song.artist}</small>
        <div class="song-duration">${
          song.duration ? formatDuration(song.duration) : "..."
        }</div>
      </div>
      <button class="favorite-btn">${
        song.fav
          ? '<i class="fa-solid fa-heart"></i>'
          : '<i class="fa-regular fa-heart"></i>'
      }</button>
          <button class="delete-btn"><i class="fa-solid fa-x"></i></button>
      </div>
      `;

    // Toggle favorite
    li.querySelector(".favorite-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      song.fav = !song.fav;
      refreshUI();
      updateSearchResults();
    });

    // Delete song
    li.querySelector(".delete-btn").addEventListener("click", (e) =>
      deleteSong(e, song)
    );

    // Open song on click
    li.addEventListener("click", () => openSong(song.id));

    container.appendChild(li);
  });
}

// Refresh main and favorite lists
function refreshUI() {
  displaySongs(allSongs, songsList);
  displaySongs(
    allSongs.filter((s) => s.fav),
    favoritesList
  );
}

function updateUI(song) {
  updatePlayerUI(song);
  updateSummaryUI(song);
  updatePlayPauseIcons(song);
}

// ──────────────── SONG CONTROL FUNCTIONS ────────────────

// Open and play a song
function openSong(id) {
  const song = allSongs.find((s) => s.id === id);
  if (!song) return;

  stopAllSongs();

  currentIndex = allSongs.indexOf(song);
  song.audio.play();
  song.playing = true;
  song.audio.volume = parseFloat(volumeBar.value);

  player.classList.add("open");
  updateUI(song);
  updateSummaryVisibility();
  refreshUI();

  currentTimeListener = () => {
    const currentTime = song.audio.currentTime;
    currentTimeEle.textContent = formatDuration(currentTime);

    const percent = song.duration > 0 ? (currentTime / song.duration) * 100 : 0;
    updateBarBg(progressInput, percent);
    setUpProgressBar(percent);
  };

  song.audio.addEventListener("timeupdate", currentTimeListener);
  song.audio.addEventListener("ended", handleSongEnd);
}

// Stop all songs
function stopAllSongs() {
  allSongs.forEach((s) => {
    if (s.playing && s.audio && currentTimeListener) {
      s.audio.removeEventListener("timeupdate", currentTimeListener);
    }
    s.audio.pause();
    s.playing = false;
    s.audio.currentTime = 0;
  });
  refreshUI();
}

// Handle song end
function handleSongEnd() {
  if (isRepeatOn) {
    allSongs[currentIndex].audio.currentTime = 0;
    allSongs[currentIndex].audio.play();
  } else if (currentIndex < allSongs.length - 1) {
    nextSong();
  } else {
    togglePlayPause();
  }
}

// Toggle play/pause
function togglePlayPause() {
  const song = allSongs[currentIndex];
  if (!song) return;

  if (song.playing) {
    song.audio.pause();
    song.playing = false;
    songCover.style.animationPlayState = "paused";
  } else {
    song.audio.play();
    song.playing = true;
    songCover.style.animationPlayState = "running";
  }
  updatePlayPauseIcons(song);
  refreshUI();
}

// Next / Previous / Random
function nextSong() {
  if (allSongs.length === 0) return;
  currentIndex = (currentIndex + 1) % allSongs.length;
  openSong(allSongs[currentIndex].id);
}

function previousSong() {
  if (allSongs.length === 0) return;
  currentIndex = (currentIndex - 1 + allSongs.length) % allSongs.length;
  openSong(allSongs[currentIndex].id);
}

function randomSong() {
  if (allSongs.length === 0) return;
  currentIndex = Math.floor(Math.random() * allSongs.length);
  openSong(allSongs[currentIndex].id);
}

// Update player UI
function updatePlayerUI(song) {
  playerTitle.textContent = song.songName;
  playerArtist.textContent = song.artist;
  currentTimeEle.textContent = formatDuration(0);
  totalTimeEle.textContent = song.duration
    ? formatDuration(song.duration)
    : "0:00";
}

// Update summary UI
function updateSummaryUI(song) {
  summaryCover.src = song.cover;
  summaryTitle.textContent = song.songName;
  summaryArtist.textContent = song.artist;
  updatePlayPauseIcons(song);
}

function updateSummaryVisibility() {
  player.classList.contains("open")
    ? summary.classList.remove("show")
    : summary.classList.add("show");
}

// Update play/pause icons
function updatePlayPauseIcons(song) {
  const icon = song.playing
    ? '<i class="fa-solid fa-pause"></i>'
    : '<i class="fa-solid fa-play"></i>';
  playPauseBtn.innerHTML = icon;
  summaryPlayPauseBtn.innerHTML = icon;
}

// Delete a song
function deleteSong(e, song) {
  e.stopPropagation();
  const songIndex = allSongs.findIndex((s) => s.id === song.id);
  if (songIndex === -1) return;

  const wasPlaying = songIndex === currentIndex;

  if (wasPlaying) {
    stopAllSongs();
  }

  allSongs.splice(songIndex, 1);

  if (wasPlaying) {
    player.classList.remove("open");
    summary.classList.remove("show");
    currentIndex = 0;
    if (allSongs.length === 0) {
      empty.classList.remove("hidden");
    }
  } else if (songIndex < currentIndex) {
    currentIndex--;
  }

  refreshUI();
  updateSearchResults();
}

// ──────────────── SEARCH FUNCTION ────────────────

// Update search results
function updateSearchResults() {
  const term = searchInput.value.trim().toLowerCase();
  if (!term) {
    searchList.innerHTML = "";
    return;
  }
  const filtered = allSongs.filter((s) =>
    s.songName.toLowerCase().includes(term)
  );
  displaySongs(filtered, searchList);
}

// ──────────────── ADD SONGS ────────────────
addSongBtn.addEventListener("click", () => songFile.click());

songFile.addEventListener("change", (e) => {
  const files = e.target.files;
  if (files.length === 0 && allSongs.length === 0) {
    empty.classList.remove("hidden");
    return;
  }
  empty.classList.add("hidden");

  Array.from(files).forEach((file) => {
    const audio = new Audio(URL.createObjectURL(file));
    const song = {
      id: crypto.randomUUID(),
      songName: file.name,
      artist: "Unknown Artist",
      audio,
      fav: false,
      playing: false,
      cover: "images/icon.webp",
      duration: 0,
    };
    audio.addEventListener(
      "loadedmetadata",
      () => (song.duration = audio.duration)
    );
    allSongs.push(song);
  });

  refreshUI();
});

// ──────────────── EVENT LISTENERS ────────────────

// Navigation between sections
navBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    const sec = this.dataset.sec;
    navBtns.forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    sections.forEach((s) => s.classList.remove("active"));
    document.getElementById(sec).classList.add("active");
  });
});

// Show/hide player
downPlayer.addEventListener("click", () => {
  player.classList.remove("open");
  updateSummaryVisibility();
});
summary.addEventListener("click", () => {
  player.classList.add("open");
  updateSummaryVisibility();
});

// Play/pause buttons
playPauseBtn.addEventListener("click", togglePlayPause);
summaryPlayPauseBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  togglePlayPause();
});

// Progress bar input
progressInput.addEventListener("input", (e) => {
  const percent = parseFloat(e.target.value);
  updateBarBg(progressInput, percent);
  setUpProgressBar(percent);

  const song = allSongs[currentIndex];
  if (song && song.duration) {
    song.audio.currentTime = (percent / 100) * song.duration;
  }
});

// Other buttons
randomSongBtn.addEventListener("click", randomSong);
previousSongBtn.addEventListener("click", previousSong);
nextSongBtn.addEventListener("click", nextSong);
repeatBtn.addEventListener("click", () => {
  isRepeatOn = !isRepeatOn;
  repeatBtn.classList.toggle("active", isRepeatOn);
});

// Volume controls
showVolumeBtn.addEventListener("click", () =>
  volumeContainer.classList.toggle("open")
);
volumeBar.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  const percent = value * 100;
  updateBarBg(volumeBar, percent);
  const song = allSongs[currentIndex];
  if (song && song.audio) song.audio.volume = value;
});

// Search input
searchInput.addEventListener("input", updateSearchResults);
