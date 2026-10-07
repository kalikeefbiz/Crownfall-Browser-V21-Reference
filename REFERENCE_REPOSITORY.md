# Crownfall Browser V21 Reference Repository

This repository is a frozen behavioral/source reference for the Crownfall Arena browser implementation.

- Browser version: **21**
- Authoritative browser commit: **5a73918bf4cd56cd54bdc98ba2a9929f4d347753**
- Verified preserved archive: **crownfall-browser-reference-v21.zip**
- Archive size: **63,023,899 bytes**
- Archive verification: **141/141 original files matched their recorded SHA-256 values; 0 mismatches**
- Preserved directly in this GitHub repository: **87 code/documentation/test files**
- Binary presentation assets represented by exact path/size/SHA-256 metadata: **54 PNG/JPEG files**

## Purpose

Use this repository as the frozen browser reference while implementing or validating Crownfall Arena in the separate Unity repository.

Do **not** treat this repository as a second active implementation. New Unity development belongs in `Crownfall-Arena-Unity`; this repository exists so Codex can inspect the historical browser rules, gameplay behavior, tests, constants, and implementation details.

## Binary asset boundary

The connected GitHub API can create binary blobs only when their bytes are passed directly into that connector. It cannot ingest the verified 63 MB archive from ChatGPT's Library/container filesystem. To avoid pretending the images transferred when they did not, the 54 PNG/JPEG presentation assets are not committed here as fake placeholders.

Their authoritative paths, byte sizes, and SHA-256 hashes are in `BINARY_ASSET_REFERENCE.json`. The original verified archive remains preserved separately in ChatGPT Library.

For browser-to-Unity behavioral/source inspection, the executable source, docs, build tools, and full test suite are directly committed and individually navigable here.

## Validation note

The preserved source was rebuilt locally with `npm run build`, which successfully regenerated `dist/index.html` and approved menu artwork.

A subsequent `npm test` run executed **180 tests: 167 passed and 13 failed**. Every remaining failure is a historical-baseline assertion that invokes `git show <older commit>`. The preserved reference archive intentionally excludes `.git/`, so those historical commit objects are unavailable in a bare extraction. After rebuilding `dist/`, no remaining failure was caused by missing built output or by a separate runtime/source regression.
