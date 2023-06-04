setTimeout(yeet, 5000); // Make sure the page is loaded. This is not foolproof. Fix this later

function yeet() {
  var videoElements = document.getElementsByClassName(
    "ytd-thumbnail-overlay-time-status-renderer"
  );

  var videos = Array.from(videoElements);

  // Calculate the total duration
  var totalDuration = 0;
  for (var i = 0; i < videos.length; i++) {
    var video = videos[i];
    var durationText = video.innerHTML;
    durationArray = durationText.split(":");

    // Convert to int
    for (let i = 0; i < durationArray.length; i++) {
      var parsed = parseInt(durationArray[i]);
      durationArray[i] = parsed;
    }

    if (isNaN(durationArray[0])) {
      continue;
    }

    totalDuration += durationArray[durationArray.length - 1]; // seconds
    totalDuration += durationArray[durationArray.length - 2] * 60; // minutes
    if (durationArray.length === 3) {
      totalDuration += durationArray[0] * 60 * 60; // hours
    }
  }

  var totalDurationString = secondsToHoursMintesSeconds(totalDuration);

  // Display total duration on youtube page
  // I had to do this retardedness to make it work
  var totalDurationElement = document.createElement("yt-formatted-string");
  totalDurationElement.className =
    "byline-item style-scope ytd-playlist-byline-renderer";
  totalDurationElement.setAttribute("is-empty", "true");
  totalDurationElement.removeAttribute("is-empty");
  var parentElement = document.getElementsByClassName("metadata-stats")[0];
  parentElement.appendChild(totalDurationElement);
  totalDurationElement.children[0].innerHTML = totalDurationString;
}

function secondsToHoursMintesSeconds(totalSeconds) {
  const totalMinutes = Math.floor(totalSeconds / 60);

  const seconds = totalSeconds % 60;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${hours}h ${minutes}m ${seconds}s`;
}
