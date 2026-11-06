# Privacy Policy

Last updated: November 7, 2026

Playlist Duration for YouTube does not collect, store, sell or share any of your data. Nothing is ever sent to the developer or to any third party.

## What the extension accesses

The extension only runs on `www.youtube.com`. To calculate a playlist's total duration it:

- Reads the playlist ID from the page URL and the video durations shown on the page.
- Requests the full list of videos in the playlist from YouTube (`www.youtube.com/youtubei/v1/browse`), the same way YouTube's own page does when you scroll down to load more videos.
- If you are signed in to YouTube, reads YouTube's `SAPISID` (or `__Secure-3PAPISID`) cookie to sign these requests, so that private playlists and Watch Later can be loaded. The cookie is only used to create a signature that is sent to YouTube, the same way YouTube's own page signs its requests. The extension never sends the cookie or the signature anywhere other than YouTube. As with any request to YouTube, your browser also includes your YouTube cookies automatically.

## What the extension does not do

- It does not send any data anywhere other than `www.youtube.com`.
- It does not store any data. The calculated total is only kept in memory while the page is open.
- It does not use analytics, tracking or advertising.
- It does not access any other website, your browsing history, or any other tabs.

## Changes

If this policy changes, the updated version will be published in this file, along with the date it was last updated.

## Contact

If you have questions about this policy, open an issue at <https://github.com/LBlend/youtube-playlist-duration/issues>.
