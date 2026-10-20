# Third-party notices

Prepared by Codex, 2026-10-20. Copies of license texts accompany this file in `licenses/` and the built site. This records software attribution; it grants no rights to audio content.

## Adapted algorithms

- Legacy QMC state machine and seed data: [presburger/qmc-decoder](https://github.com/presburger/qmc-decoder), commit `fb1e04b03246db406e9fc15c4426b79ed321e4f5`, MIT, Copyright (c) 2019 Presburger. Original source header names mayusheng. Adapted to JavaScript in `src/engine.mjs`; original source and fixture reference retained under `research/upstream/`. See [MIT text](licenses/presburger-MIT.txt).
- NCM parser/stream algorithm: informed by [Magiicccc/music-batch-unlock](https://github.com/Magiicccc/music-batch-unlock), commit `837c2ccd09d85eb0ae96132e96b84d2e5897b4c6`, derived from Unlock Music, Copyright (c) 2019-2025 MengYX, MIT. Reimplemented with strict bounds, local embedded covers, no remote cover lookup, no Vue/WASM/PWA dependency. See [MIT text](licenses/MengYX-MIT.txt).
- [taurusxin/ncmdump](https://github.com/taurusxin/ncmdump), commit `4ede4cee1bad35bbf28a7b5524feeca0422a4feb`, used as a source reference for NCM field layout, especially cover allocation versus used length. No C++/TagLib/AES binary is shipped or executed. Root MIT text contains placeholders; kept in `licenses/ncmdump-reference-MIT.txt` for audit. Full reference repository dependencies have not been audited for redistribution.

## npm runtime dependencies

### Additional format algorithms and data (2026-10-20)

- KWM, UC, XM, MG3D, TM and Ximalaya tables: MengYX MIT algorithms in the pinned music-batch-unlock source above. Strict bounds, actual output sniffing and MG3D candidate isolation added by Codex.
- QMC map/RC4, TEA eKey and KGG/KGM slot-1 algorithm reference: [Aaron-gx/KGG-Decryptor](https://github.com/Aaron-gx/KGG-Decryptor), commit `82aac3a78d2a90921021b9bae1d486faae1a736e`, root MIT Copyright (c) 2026. See [license](licenses/KGG-Decryptor-MIT.txt). No Rust executable or database scan is used. As of 2026-10-21, versions requiring external keys are unsupported; only keys embedded in the input file are used.
- KGM public table prefix (6,553,600 bytes, covering the 100 MiB input cap) and MEND constants: [HRuiCcc/music-geshizhuanhuan](https://github.com/HRuiCcc/music-geshizhuanhuan), commit `28f4ed0724f85978405d961c0e955266eed383ee`, MIT Copyright (c) 2026 music-geshizhuanhuan contributors. See [license](licenses/music-formats-python-MIT.txt). Table is embedded as compressed data, not executable code. No upstream Python module is executed.
- VPR difference mask and independent QMC key/keystream test vectors: [Unlock Music mirror](https://git.dov.moe/Mirror/unlock-music), commit `c4f07f08dc773c267491bbf78e3d48bf230569c1`, MIT Copyright (c) 2019-2025 MengYX. Golden vectors contain keys and XOR-derived keystream, no song audio payload. [MIT text](licenses/MengYX-MIT.txt).

### MP3 encoder

The local, unmodified `vendor/lamejs.js` is **@breezystack/lamejs 1.2.7**, Alex Zhukov / LAME contributors, package-declared LGPL-3.0. It is loaded as a separate, independently replaceable ES module by the Worker; it is not merged into the application bundle. Source [shijinyu/lamejs](https://github.com/shijinyu/lamejs), npm `gitHead` `1fb0ef5fa177413107e2e107d054a9b994e3f79c`. The app uses LAME for genuine PCM-to-MP3 encoding; [LAME website](https://lame.sourceforge.net/).

Accompanying files: [upstream notice](licenses/lamejs-notice.txt), [LGPL-3.0](licenses/LGPL-3.0.txt), [GPL-3.0](licenses/GPL-3.0.txt), [upstream Java reference COPYING](licenses/LGPL-2.0-reference.txt), and [matching JS source/build files](licenses/lamejs-source.zip). Extract the source archive, install the pinned build dependencies with pnpm, and run `pnpm build`; replace `vendor/lamejs.js` with the resulting ES module. No encoder modifications were made. Users may replace/debug the library, including reverse engineering for that purpose under its license.

Pinned versions and integrity hashes: `package-lock.json`. Full dependency texts are in `licenses/`.

| Package | Version | License |
|---|---|---|
| crypto-js | 4.2.0 | MIT |
| browser-id3-writer | 6.3.1 | MIT |
| jszip | 3.10.1 | MIT option selected from MIT OR GPL-3.0-or-later |
| lie | 3.3.0 | MIT |
| immediate | 3.0.6 | MIT |
| pako | 1.0.11 | MIT AND Zlib (zlib-derived source headers retained by bundler) |
| readable-stream | 2.3.8 | MIT with inherited Node/Joyent notices |
| core-util-is | 1.0.3 | MIT |
| inherits | 2.0.4 | ISC |
| isarray | 1.0.0 | MIT |
| process-nextick-args | 2.0.1 | MIT |
| safe-buffer | 5.1.2 | MIT |
| string_decoder | 1.1.1 | MIT |
| util-deprecate | 1.0.2 | MIT |
| setimmediate | 1.0.5 | MIT |

Build tool esbuild 0.25.11 uses MIT; platform helper is a build-time npm package. npm installation used `--ignore-scripts`; no upstream repository binaries/install hooks were run. Browser entry graphs are saved in `docs/build-meta.json`. Libraries are bundled locally, with no runtime CDN imports.

CryptoJS 4.2.0 has been marked deprecated/unmaintained by its publisher. It is used only for compatibility decryption, not credential protection. Replacement and security advisory review remain release follow-ups. Repository license inspection is not a legal clearance or a comprehensive security audit.
