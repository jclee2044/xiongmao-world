# Sources and runtime components

- Five handoff images: supplied by the user; PNGs described in the handoff as AI-generated. The original photograph defines the toy's identity. The candidate Panda is used unchanged as a sprite. PWA icons are standard size preparations of that sprite. The other concepts are not shipped to the browser as a map.
- Qwen3 4B, Q4_K_M: downloaded through Ollama's model registry, Apache-2.0 model license. https://ollama.com/library/qwen3 and https://huggingface.co/Qwen/Qwen3-4B. Dialogue generation runs on the CPU on this PC. Qwen3 1.7B failed the first quality gate; it is retained as a diagnostic download, not selected.
- Ollama 0.33.3: MIT; package from the configured Omarchy repository, installed under `tools/ollama/`. Model downloads are digest-verified by Ollama. Its runtime creates its normal per-user identity key in `~/.ollama/`; game state and models remain under project `data/`. Cloud inference disabled.
- eSpeak NG 1.52.0: GPL-3.0-or-later; pcaudiolib 1.3 and libsonic 0.2.0 dependencies from the same repository, installed under `tools/speech/`. See https://github.com/espeak-ng/espeak-ng. Mandarin is synthesized on demand; no prerecorded dialogue is served. This is a basic robotic voice and needs learner evaluation.
- pinyin-pro 3.29.4: MIT; https://github.com/zh-lx/pinyin-pro. Dictionary-based pinyin, not language-model spelling. Phrase-specific pronunciation and generated Chinese still need content review.
- Playwright 1.63.0: Apache-2.0; development-only automated browser tests against system Chromium.
- Piper Huayan was inspected but not installed: its specific model card lists an unknown dataset license. https://huggingface.co/rhasspy/piper-voices/blob/main/zh/zh_CN/huayan/medium/MODEL_CARD.

No remote inference API, external font, analytics or third-party browser CDN is used. Package/model installation requires network access; actual conversations use loopback services.
