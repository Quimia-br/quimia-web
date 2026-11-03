# MediaPipe Face Landmarker

`face_landmarker.task` is the official float16 model, version 1. It is stored
locally so builds and eye navigation do not depend on a model download.

Source: https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task

SHA-256: `64184e229b263107bc2b804c6625db1341ff2bb731874b0bcc2fe6544e0bc9ff`

Documentation: https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker#models

Vite copies the model to `dist/models`. The matching WASM runtime comes from the
locked `@mediapipe/tasks-vision` dependency through `build/mediapipe-assets.ts`.
