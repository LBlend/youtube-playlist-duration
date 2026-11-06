# Playlist Duration for YouTube

A Chrome and Firefox extension that displays the total duration of a playlist

*Note: This is a MVP and thus has a lot of undefined behaviour. It does not support other languages than english, for now.*

The extension fetches every video in the playlist from YouTube, so the total includes videos that haven't been loaded on the page yet. If that request fails, it falls back to the videos currently loaded on the page.

![example](https://github.com/LBlend/youtube-playlist-duration/assets/24893890/f1d63eac-1ba6-40ad-95a8-415252fec801)


## Install

Download this repo and make sure it's unzipped.

### Chrome

[Follow this guide](https://developer.chrome.com/docs/extensions/mv3/getstarted/development-basics/#load-unpacked) (Chrome 111 or newer).

### Firefox

Requires Firefox 128 or newer.

1. Open `about:debugging#/runtime/this-firefox`.
2. Click "Load Temporary Add-on..." and select `manifest.json` from this repo.
3. If the total doesn't show up, open `about:addons`, select the extension, and allow access to `www.youtube.com` under "Permissions".

Temporary add-ons are removed when Firefox restarts. To install it permanently, the extension has to be signed through [addons.mozilla.org](https://addons.mozilla.org/developers/).

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
