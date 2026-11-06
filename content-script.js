(() => {
  const DURATION_SELECTOR = [
    "ytd-playlist-video-renderer ytd-thumbnail-overlay-time-status-renderer",
    'ytd-browse[page-subtype="playlist"] yt-lockup-view-model yt-thumbnail-badge-view-model',
  ].join(", ");
  const TOTAL_DURATION_ATTRIBUTE = "data-playlist-total-duration";
  const LEGACY_HEADER_SELECTOR =
    'ytd-browse[page-subtype="playlist"] .metadata-stats';
  const PAGE_HEADER_ROW_SELECTOR = `ytd-browse[page-subtype="playlist"] yt-page-header-renderer .ytContentMetadataViewModelMetadataRow:not([${TOTAL_DURATION_ATTRIBUTE}]):has(> .ytContentMetadataViewModelMetadataText)`;

  const BROWSE_URL = "/youtubei/v1/browse?prettyPrint=false";
  const MAX_PAGES = 200;

  const UPDATE_DELAY_MS = 500;

  let updateScheduled = false;
  let fullTotal = { playlistId: null, seconds: null };

  new MutationObserver(scheduleUpdate).observe(document.body, {
    childList: true,
    subtree: true,
  });
  scheduleUpdate();

  function scheduleUpdate() {
    if (updateScheduled) {
      return;
    }
    updateScheduled = true;
    setTimeout(() => {
      updateScheduled = false;
      showTotalDuration();
    }, UPDATE_DELAY_MS);
  }

  function showTotalDuration() {
    if (location.pathname !== "/playlist") {
      return;
    }
    const playlistId = new URLSearchParams(location.search).get("list");
    if (!playlistId) {
      return;
    }

    if (fullTotal.playlistId !== playlistId) {
      fullTotal = { playlistId, seconds: null };
      loadFullTotal(playlistId);
    }

    if (fullTotal.seconds !== null) {
      renderTotalDuration(formatDuration(fullTotal.seconds));
    } else if (document.querySelector(DURATION_SELECTOR)) {
      renderTotalDuration(formatDuration(getLoadedSeconds()));
    }
  }

  async function loadFullTotal(playlistId) {
    try {
      const seconds = await fetchPlaylistSeconds(playlistId);
      if (fullTotal.playlistId === playlistId) {
        fullTotal.seconds = seconds;
        scheduleUpdate();
      }
    } catch (error) {
      console.warn("Playlist Duration for YouTube: falling back to loaded videos", error);
    }
  }

  async function fetchPlaylistSeconds(playlistId) {
    let response = await browse({ browseId: `VL${playlistId}` });
    let seconds = 0;
    let videos = 0;

    for (let page = 0; page < MAX_PAGES; page++) {
      const result = readPlaylistPage(response);
      seconds += result.seconds;
      videos += result.videos;
      if (!result.token) {
        if (videos === 0) {
          throw new Error("No videos found in the playlist response");
        }
        return seconds;
      }
      response = await browse({ continuation: result.token });
    }
    throw new Error(`Playlist has more than ${MAX_PAGES} pages`);
  }

  async function browse(body) {
    const context = window.ytcfg?.get?.("INNERTUBE_CONTEXT");
    if (!context) {
      throw new Error("YouTube config is not available");
    }

    const response = await fetch(BROWSE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders()),
      },
      body: JSON.stringify({ context, ...body }),
    });
    if (!response.ok) {
      throw new Error(`Browse request failed with status ${response.status}`);
    }
    return response.json();
  }

  async function getAuthHeaders() {
    if (!window.ytcfg.get("LOGGED_IN")) {
      return {};
    }
    const sapisid = getCookie("SAPISID") ?? getCookie("__Secure-3PAPISID");
    if (!sapisid) {
      return {};
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const hash = await sha1(`${timestamp} ${sapisid} ${location.origin}`);
    const headers = {
      Authorization: `SAPISIDHASH ${timestamp}_${hash}`,
      "X-Goog-AuthUser": String(window.ytcfg.get("SESSION_INDEX") ?? 0),
      "X-Origin": location.origin,
    };
    const pageId = window.ytcfg.get("DELEGATED_SESSION_ID");
    if (pageId) {
      headers["X-Goog-PageId"] = pageId;
    }
    return headers;
  }

  function getCookie(name) {
    const prefix = `${name}=`;
    const cookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(prefix));
    return cookie ? cookie.slice(prefix.length) : null;
  }

  async function sha1(text) {
    const digest = await crypto.subtle.digest(
      "SHA-1",
      new TextEncoder().encode(text),
    );
    return Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
  }

  function readPlaylistPage(response) {
    const result = { seconds: 0, videos: 0, token: null };
    const roots = [response.contents, response.onResponseReceivedActions];
    for (const items of findVideoLists(roots)) {
      for (const item of items) {
        if (isVideoItem(item)) {
          result.seconds += getItemSeconds(item);
          result.videos++;
        }
        result.token ??= getContinuationToken(item);
      }
    }
    return result;
  }

  function* findVideoLists(node) {
    if (Array.isArray(node)) {
      if (node.some(isVideoItem)) {
        yield node;
        return;
      }
      for (const item of node) {
        yield* findVideoLists(item);
      }
    } else if (node && typeof node === "object") {
      for (const value of Object.values(node)) {
        yield* findVideoLists(value);
      }
    }
  }

  function isVideoItem(item) {
    return (
      Boolean(item?.playlistVideoRenderer) ||
      item?.lockupViewModel?.contentType === "LOCKUP_CONTENT_TYPE_VIDEO"
    );
  }

  function getItemSeconds(item) {
    if (item.playlistVideoRenderer) {
      return Number(item.playlistVideoRenderer.lengthSeconds) || 0;
    }
    const overlays =
      item.lockupViewModel.contentImage?.thumbnailViewModel?.overlays ?? [];
    const badgeText = overlays
      .flatMap((overlay) => overlay.thumbnailBottomOverlayViewModel?.badges ?? [])
      .map((badge) => badge.thumbnailBadgeViewModel?.text ?? "")
      .join(" ");
    return parseDuration(badgeText);
  }

  function getContinuationToken(item) {
    const continuation =
      item?.continuationItemViewModel ?? item?.continuationItemRenderer;
    return continuation ? findContinuationToken(continuation) : null;
  }

  function findContinuationToken(node) {
    if (!node || typeof node !== "object") {
      return null;
    }
    if (typeof node.continuationCommand?.token === "string") {
      return node.continuationCommand.token;
    }
    for (const value of Object.values(node)) {
      const token = findContinuationToken(value);
      if (token) {
        return token;
      }
    }
    return null;
  }

  function renderTotalDuration(text) {
    for (const stats of document.querySelectorAll(LEGACY_HEADER_SELECTOR)) {
      renderInLegacyHeader(stats, text);
    }
    for (const row of document.querySelectorAll(PAGE_HEADER_ROW_SELECTOR)) {
      renderInPageHeader(row, text);
    }
  }

  function renderInLegacyHeader(stats, text) {
    let element = stats.querySelector(`[${TOTAL_DURATION_ATTRIBUTE}]`);
    if (!element) {
      element = document.createElement("yt-formatted-string");
      element.setAttribute(TOTAL_DURATION_ATTRIBUTE, "");
      element.className = "byline-item style-scope ytd-playlist-byline-renderer";
      element.setAttribute("is-empty", "true");
      element.removeAttribute("is-empty");
      stats.appendChild(element);
    }
    setText(element.firstElementChild ?? element, text);
  }

  function renderInPageHeader(row, text) {
    const ownNodes = `:scope > [${TOTAL_DURATION_ATTRIBUTE}]`;
    let totalRow = row.parentElement.querySelector(`${ownNodes}:not(span)`);
    if (!totalRow) {
      row.parentElement.querySelectorAll(ownNodes).forEach((node) => node.remove());

      totalRow = document.createElement("div");
      totalRow.setAttribute(TOTAL_DURATION_ATTRIBUTE, "");
      totalRow.className = row.className;

      const element = document.createElement("span");
      element.className =
        "ytAttributedStringHost ytContentMetadataViewModelMetadataText";
      totalRow.append(element);

      if (row.classList.contains("ytContentMetadataViewModelMetadataRowInline")) {
        const delimiter = document.createElement("span");
        delimiter.setAttribute(TOTAL_DURATION_ATTRIBUTE, "");
        delimiter.className =
          "ytContentMetadataViewModelDelimiter ytContentMetadataViewModelDelimiterStandalone";
        delimiter.textContent = "•";
        row.after(delimiter, totalRow);
      } else {
        row.after(totalRow);
      }
    }
    setText(totalRow.firstElementChild, text);
  }

  function setText(element, text) {
    if (element.textContent !== text) {
      element.textContent = text;
    }
  }

  function getLoadedSeconds() {
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
})();
