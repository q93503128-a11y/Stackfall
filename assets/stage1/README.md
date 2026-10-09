# Collapse Frontier production surfaces

Eight original transparent WebP components generated with OpenAI ImageGen on 2026-10-09, then cropped, alpha-trimmed and downsampled with Pillow. No third-party game asset is used. Research screenshots under docs are evidence only and are never loaded by the game.

Exact generation prompts: generation-prompts.json. Measured crop slots, alpha bounds, dimensions and compressed bytes: manifest.json. Production texture count: 8. Total compressed payload: 568,608 bytes; decoded RGBA pixels: 5,404,772 bytes. The browser loads each once; only nearby world pieces and a single articulated boss reuse them.

`python scripts/package-stage1-assets.py --source-dir PATH` repackages the two inspected ImageGen PNG atlases named in the manifest. Their original generated filenames are recorded for reproducibility; the packaged components are the deployable source of truth. Runtime poses and collision contours live in src/stage01-production-art.js and src/stage-runtime.js. The two shoulder connectors use filled shaded metal surfaces and the same authored polygon poses.

ImageGen chest/arms/reactor atlas: exec-caae6797-348d-4e41-b7a7-f44006333eee.png. Hardware atlas after transparency edit: exec-e2645ba6-d4ad-4f23-851a-cd6834286451.png. Both were visually inspected before packaging. The generator varied the requested equal grid; crop coordinates therefore follow actual component bounds rather than assumed cells.
