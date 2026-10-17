# forumviewer-updates

This repository holds over-the-air updates for the design and script of the **forumviewer** Android app (forumla.de in a XenForo-style dark theme).

| File | Content |
|---|---|
| `forumla.css` | the app's theme |
| `forumla.js` | menu, editor, info panel and page fixes |
| `manifest.json` | version number and SHA-256 checksums of both files |
| `manifest.sig` | ECDSA P-256 signature of `manifest.json` |

The app only installs an update if:

- the signature matches the public key built into the app,
- both checksums match,
- and the version is newer than the one it already has.

Changes made directly in this repository without the private signing key are ignored by the app.

Updates are published with `publish-update.ps1` from the app's project folder. Don't edit the files here by hand.
