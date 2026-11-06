const DURATION_SELECTOR =
  "ytd-playlist-video-renderer ytd-thumbnail-overlay-time-status-renderer";

setTimeout(showTotalDuration, 5000); // Make sure the page is loaded. This is not foolproof. Fix this later

function showTotalDuration() {
  const totalDuration = getTotalSeconds();

  var totalDurationString = formatDuration(totalDuration);

  // Display total duration on youtube page
  var totalDurationElement = document.createElement("yt-formatted-string");
  totalDurationElement.className =
    "byline-item style-scope ytd-playlist-byline-renderer";
  totalDurationElement.setAttribute("is-empty", "true");
  totalDurationElement.removeAttribute("is-empty");
  var parentElement = document.getElementsByClassName("metadata-stats")[0];
  parentElement.appendChild(totalDurationElement);
  totalDurationElement.children[0].innerHTML = totalDurationString;
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
