const DURATION_SELECTOR =
  "ytd-playlist-video-renderer ytd-thumbnail-overlay-time-status-renderer";
const TOTAL_DURATION_ID = "playlist-total-duration";

setTimeout(showTotalDuration, 5000); // Make sure the page is loaded. This is not foolproof. Fix this later

function showTotalDuration() {
  renderTotalDuration(formatDuration(getTotalSeconds()));
}

function renderTotalDuration(text) {
  let element = document.getElementById(TOTAL_DURATION_ID);
  if (!element) {
    const parent = document.querySelector(".metadata-stats");
    if (!parent) {
      return;
    }
    element = document.createElement("yt-formatted-string");
    element.id = TOTAL_DURATION_ID;
    element.className = "byline-item style-scope ytd-playlist-byline-renderer";
    element.setAttribute("is-empty", "true");
    element.removeAttribute("is-empty");
    parent.appendChild(element);
  }

  const target = element.firstElementChild ?? element;
  if (target.textContent !== text) {
    target.textContent = text;
  }
}

function getTotalSeconds() {
  let total = 0;
  for (const element of document.querySelectorAll(DURATION_SELECTOR)) {
    total += parseDuration(element.textContent);
  }
  return total;
}

function parseDuration(text) {
  const match = text.match(/\d+(?::\d+)+/);
  if (!match) {
    return 0;
  }
  return match[0]
    .split(":")
    .reduce((seconds, part) => seconds * 60 + Number(part), 0);
}

function formatDuration(totalSeconds) {
  const totalMinutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}
