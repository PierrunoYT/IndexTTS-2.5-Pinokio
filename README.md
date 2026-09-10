# IndexTTS 2.5 for Pinokio

One-click local launcher for the official
[IndexTTS 2.5](https://github.com/index-tts/index-tts) Web UI and model.
IndexTTS clones a voice from one reference recording and synthesizes speech in
Chinese, English, Japanese, Spanish, or Arabic.

## Features

- Zero-shot voice cloning from one reference audio clip
- Cross-lingual synthesis while preserving the reference timbre
- Emotion from the speaker, a second reference, an eight-value vector, or text
- Pinyin, CMU phoneme, and Japanese Kana pronunciation annotations
- Speaking-duration control from `0.5` to `2.0`
- Official IndexTTS Web UI, source, presets, and generated-output handling
- Pinokio install, start, update, reset, and dependency deduplication actions

## Requirements

- Python 3.10 or 3.11, provided by the Pinokio AI bundle
- Windows, Linux, or an Apple Silicon Mac. Intel Macs are not supported:
  upstream requires PyTorch 2.8, which has no macOS x86_64 builds.
- NVIDIA GPU recommended
- About 6 GB of VRAM on GPUs with BF16; 8 GB recommended for legacy GPUs
- Enough disk space for the main and auxiliary checkpoints

CPU inference is supported by the upstream code but is substantially slower.
The launcher requests reduced precision. IndexTTS 2.5 uses BF16 on supported
GPUs and GPT-only FP16 compatibility mode on older CUDA GPUs.

### GTX 1080 and other Pascal GPUs

The GTX 1080 has 8 GB of VRAM, CUDA compute capability 6.1, and no BF16
support. Two upstream defaults otherwise prevent it from being practical:

- PyTorch's CUDA 12.8 binaries no longer contain Pascal kernels.
- IndexTTS 2.5 normally falls back from unavailable BF16 to FP32, which leaves
  very little usable VRAM on an 8 GB card.

This launcher selects the upstream-compatible PyTorch 2.8 CUDA 12.6 build for
legacy GPUs (and CUDA 12.8 for newer GPUs), does not install or enable
unsupported FlashAttention, and applies a small compatibility patch that casts
only the GPT to FP16. The codec, diffusion model, feature extractor, and
vocoder remain FP32 for numerical stability.
QwenEmotion is automatically skipped below 10 GB of VRAM, so emotion by text
description is unavailable on a GTX 1080; speaker emotion, an emotion audio
reference, and the eight-value emotion vector still work.

For a GTX 1080:

1. Install a current NVIDIA driver (560 or newer is recommended). A separate
   CUDA Toolkit is not needed for the prebuilt PyTorch wheel.
2. Click **Install** or **Reinstall**, then **Start**. The startup log should say
   `using GPT-only FP16 compatibility mode`.
3. Close other GPU applications. If a long request runs out of memory, retry
   with shorter text so the low-VRAM segmenter has less work per request.

Do not manually enable FlashAttention, `--accel`, `--torch_compile`,
`--cuda_kernel`, DeepSpeed, or QwenEmotion on Pascal. The FP16 compatibility
path is launcher-provided because upstream officially supports only BF16 for
2.5; it is expected to save enough memory for 8 GB, but will be slower than an
RTX GPU and cannot provide BF16's numerical range.

## Install and run

1. Open this launcher in Pinokio.
2. Click **Install**. The launcher clones the official source, checks out the
   upstream revision this launcher is tested against, applies its
   legacy-GPU compatibility patch, installs the environment, downloads
   `IndexTeam/IndexTTS-2.5`, downloads the auxiliary models, and fetches the
   official examples.
3. Click **Start**.
4. Pinokio opens the dynamically allocated local Web UI URL.
5. Upload a clear reference recording, choose the target language, enter text,
   adjust emotion or duration if needed, and generate the waveform.

Installed data is stored under:

- `app/src/` — official upstream source
- `app/env/` — isolated Python environment
- `app/src/checkpoints/` — model and auxiliary checkpoints
- `app/src/outputs/` — generated audio

## Controls

### Languages

Use `ZH`, `EN`, `JA`, `ES`, or `AR`. The reference recording and target
language may differ.

### Emotion

The official UI provides these modes:

1. Keep the emotion of the speaker reference.
2. Supply a separate emotion reference and adjust its weight.
3. Set `[happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]`.
4. Describe the emotion in text when QwenEmotion is loaded. The upstream UI
   hides this experimental mode on lower-VRAM GPUs by default.

Random emotion sampling can reduce voice-cloning fidelity.

### Speed

`duration_factor` is the duration multiplier:

- Below `1.0` produces faster speech.
- `1.0` keeps the normal duration.
- Above `1.0` produces slower speech.
- Valid range: `0.5` to `2.0`.

### Pronunciation

Use `<word|reading>` annotations:

```text
他在银<行|XING2>里<行|HANG2>走了半天。
He had a <minute|M IH1 . N AH0 T> to review it.
彼は料理が<上手|じょうず>だ。
```

## Update and reset

- **Update** pulls this launcher, then reapplies the installation. The upstream
  source moves only when the launcher's pinned revision does, so the
  compatibility patch is always applied to a revision it was verified against.
- **Save Disk Space** deduplicates packages in `app/env`.
- **Reset** removes `app/env` and `app/src`, including downloaded models,
  presets, and generated outputs. Copy anything important out first.

## Programmatic API

The running application exposes Gradio's generated API. Pinokio allocates the
port dynamically, so the `7860` in the snippets below is only a placeholder --
substitute the host and port Pinokio actually shows. Inspect the exact live
schema at:

```bash
curl "$BASE/gradio_api/info"
```

The synthesis endpoint is `/gen_single`. Its ordered inputs are:

```text
emotion_mode, speaker_audio, text, language, emotion_audio, emotion_weight,
happy, angry, sad, afraid, disgusted, melancholic, surprised, calm,
emotion_text, random_emotion, max_segment_tokens, duration_factor,
do_sample, top_p, top_k, temperature, length_penalty, num_beams,
repetition_penalty, max_mel_tokens
```

The examples below use speaker-emotion mode and the upstream defaults.

### JavaScript

Install `@gradio/client`, then:

```javascript
import { Client, handle_file } from "@gradio/client";
import { readFile } from "node:fs/promises";

const base = "http://127.0.0.1:7860";
const client = await Client.connect(base);
const prompt = new Blob([await readFile("prompt.wav")], { type: "audio/wav" });

const result = await client.predict("/gen_single", [
  0, handle_file(prompt), "Hello from IndexTTS 2.5.", "EN", null, 0.65,
  0, 0, 0, 0, 0, 0, 0, 0, "", false, 120, 1.0,
  true, 0.8, 30, 0.8, 0.0, 3, 10.0, 1500
]);

console.log(result.data);
```

### Python

Install `gradio_client`, then:

```python
from gradio_client import Client, file

client = Client("http://127.0.0.1:7860")
result = client.predict(
    0, file("prompt.wav"), "Hello from IndexTTS 2.5.", "EN", None, 0.65,
    0, 0, 0, 0, 0, 0, 0, 0, "", False, 120, 1.0,
    True, 0.8, 30, 0.8, 0.0, 3, 10.0, 1500,
    api_name="/gen_single",
)
print(result)
```

### Curl

For a prompt available by URL, submit the ordered payload, save the returned
`event_id`, then stream the result:

```bash
BASE="http://127.0.0.1:7860"
PROMPT_URL="https://example.com/prompt.wav"

curl -X POST "$BASE/gradio_api/call/gen_single" \
  -H "Content-Type: application/json" \
  -d "{\"data\":[0,{\"path\":\"$PROMPT_URL\"},\"Hello from IndexTTS 2.5.\",\"EN\",null,0.65,0,0,0,0,0,0,0,0,\"\",false,120,1.0,true,0.8,30,0.8,0.0,3,10.0,1500]}"

curl -N "$BASE/gradio_api/call/gen_single/EVENT_ID"
```

For local audio files, the JavaScript and Python clients handle upload
automatically. The Web UI footer also generates client snippets from the live
schema.

## Limitations and license

Long text is segmented and concatenated with short silences, so prosody does not
span a segment boundary. Reference-speaker consent is the user's responsibility.

The model and upstream code are governed by the
[Bilibili Model Use License Agreement](https://huggingface.co/IndexTeam/IndexTTS-2.5/blob/main/LICENSE).
Review it before use. Launcher code retains its own repository license.
