---
title: "EmbeddingGemma 2: one sub-1B model for text, code, images, video and audio"
seoTitle: "EmbeddingGemma 2: multimodal embedding guide"
description: "Google's open embedding model puts text, code, images, video and audio in one 768-d space at 740M params. Where it beats SOTA, where it doesn't, how to run it."
date: "2026-10-06"
category: "AI"
tags: ["embeddings", "multimodal", "rag", "llm", "ai-engineering"]
cover: "/blog/covers/embeddinggemma-2-multimodal-embeddings.png"
---

Google released [EmbeddingGemma 2](https://blog.google/innovation-and-ai/technology/developers-tools/embeddinggemma-2/) today: an open embedding model that maps text, code, images, video and audio into **one** 768-dimensional vector space, in 740M parameters, under Apache 2.0. A typical multimodal retrieval stack needs a text embedder, a CLIP-style image model, and either a speech-to-text step or a separate audio model, each with its own vector space. This model replaces all of them, and Google reports the quantized text-only path running in about 190 MB of RAM on a phone.

I went through the model card and launch material and cross-checked every number against the strongest open models in each category. The picture is more mixed, and more interesting, than "best in class".

## TL;DR

- **What it is:** a 270M text backbone (Gemma 4 based) plus a 170M vision encoder and a 300M audio encoder that you load only if you need them. One 8,192-token context, mean pooling, 768-d output, Matryoshka truncation to 512/256/128.
- **Where it leads:** code retrieval (MTEB Code **78.68**, ahead of Qwen3-Embedding-0.6B's 75.41) and video (MMEB v2 Video **50.67** vs 34.6 for the 2B VLM2Vec-V2). It is also the only sub-1B open model I know of that covers all four modalities, audio included.
- **Where it doesn't:** general text (MTEB Multilingual 61.36 vs 64.33 for Qwen3-Embedding-0.6B; English v2 actually *dropped* from 69.67 to 68.46 vs EmbeddingGemma 1) and images, where Qwen3-VL-Embedding-2B is far ahead (75.0 vs 57.28), at almost 3× the size and without audio.
- **Use it when** you need retrieval across modalities on-device or on a budget: local RAG, code search for agents, media libraries, audio archives. **Skip it** for text-only server-side search where a bigger text embedder fits your latency budget.
- **Gotchas:** never run it in `float16` (NaNs, silently), re-normalize after truncating, and use the task prefixes.

## What shipped

![Architecture diagram of EmbeddingGemma 2. Text and code go through a 140M token embedder at one token per subword; images go through a 170M vision encoder at 280 tokens per image; video frames sampled at 1 fps reuse the same vision encoder at 140 tokens per frame; mono 16 kHz audio goes through a 300M audio encoder at 25 tokens per second. All tokens share one 8,192-token sequence processed by a 24-layer, 130M-parameter Gemma 4 text backbone with 5 local to 1 global attention. The output is mean pooled, projected from 512 to 768 dimensions and L2-normalized, and can be truncated to 512, 256 or 128 dimensions. Loadable bundles: text 270M, text plus vision 440M, text plus audio 570M, full multimodal 740M.](/blog/media/embeddinggemma-2-multimodal-embeddings/architecture.png)

The design is the interesting part. EmbeddingGemma 2 doesn't keep a separate tower per modality and then align them in a contrastive head, the way CLIP-style models do. Every input becomes **tokens in the same sequence**: subword tokens for text, "soft tokens" from the vision and audio encoders for everything else. Then the same 24-layer backbone reads them all. That's why one input can interleave a product description, two photos and a demo clip, and still come out as a single vector.

| | EmbeddingGemma 1 | EmbeddingGemma 2 |
| --- | --- | --- |
| Parameters | 300M | 270M text · 440M +vision · 570M +audio · 740M full |
| Modalities | text | text, code, image, video, audio (interleaved) |
| Context | 2,048 tokens | 8,192 tokens |
| Output | 768-d, MRL 512/256/128 | 768-d, MRL 512/256/128 |
| License | Gemma terms, gated download | **Apache 2.0, ungated** |
| Languages | 100+ | 100+ |

Two details from the spec sheet are easy to miss:

- **Half of the "text model" is a lookup table.** The 270M text path is a 130M transformer plus a 140M embedder. The embedder is the token-embedding table for Gemma's 262,144-token vocabulary at width 512 ($262{,}144 \times 512 \approx 134\text{M}$). Big vocabularies are what make 100+ languages cheap, and a lookup table costs memory but almost no compute.
- **The license changed.** EmbeddingGemma 1 shipped under the Gemma terms behind a click-through gate. Version 2 is plain Apache 2.0 and the Hugging Face repo is ungated, so CI jobs and Docker builds can pull it without a token.

## How one sequence becomes one vector

![Animation: a text chunk, an image, three video frames and an audio waveform slide into a single token sequence while an 8,192-token budget bar fills up (text one token per subword, 280 tokens per image, 140 tokens per video frame, 25 tokens per second of audio), the counter reaches 4,790 of 8,192 tokens, then the whole sequence collapses into a single 768-dimensional vector.](/blog/media/embeddinggemma-2-multimodal-embeddings/interleaved.gif)

The animation's example input is about 400 subwords of text, one image (280), 24 video frames (3,360) and 30 seconds of audio (750): 4,790 tokens, a bit over half the budget. The blocks are schematic, not to scale.

Every modality spends the same 8,192-token budget at a fixed rate:

| Input | Token cost | Max on its own |
| --- | --- | --- |
| Text | 1 token per subword | 8,192 tokens |
| Image | 280 tokens (default; configurable 70–1,120) | ~29 images |
| Video | 140 tokens per frame, sampled at 1 fps | ~58 frames |
| Audio | 25 tokens per second, mono 16 kHz | ~327 s (5.5 min) |

Two practical consequences. A two-minute video at 1 fps eats 120 × 140 = 16,800 tokens, which is twice the budget, so long video has to be chunked into scenes or windows before you embed it. And dropping the vision budget to 70 tokens per image takes you to ~114 images or frames per input, so you can trade detail for coverage.

The text side is **task-steered**: short prefixes tell the model what the vector will be used for. Retrieval is asymmetric (queries and documents get different prefixes); classification, clustering and similarity are symmetric:

| Use case | Query prefix | Document prefix |
| --- | --- | --- |
| Search / RAG | `task: search result \| query: {q}` | `title: {title or none} \| text: {doc}` |
| Question answering | `task: question answering \| query: {q}` | `title: … \| text: …` |
| Fact checking | `task: fact checking \| query: {claim}` | `title: … \| text: …` |
| Code search | `task: code retrieval \| query: {q}` | `title: {filename} \| text: {code}` |
| Classification / clustering / STS | `task: classification \| query: {x}` (same prefix for every input) | — |

Images, video and audio take **no** prefix. `sentence-transformers` ships all of these as named prompts (`SearchQuery`, `Document`, `CodeRetrieval`, …), so you rarely type them by hand.

## Where it beats the state of the art, and where it doesn't

![Two bar charts. Left, text and code on MTEB Mean(Task): Multilingual v2 — EmbeddingGemma 2 61.36, EmbeddingGemma 1 61.15, Qwen3-Embedding-0.6B 64.33; English v2 — 68.46, 69.67, 70.70; Code v1 — 78.68, 68.76, 75.41. Right, MMEB v2: Image — EmbeddingGemma 2 57.28, VLM2Vec-V2 2B 64.9, Qwen3-VL-Embedding-2B 75.0; Video — 50.67, 34.6, 61.9; Visual documents — 67.84, 69.2, 79.2; Overall — 59.01, 59.2, 73.2.](/blog/media/embeddinggemma-2-multimodal-embeddings/benchmarks.png)

Google's launch post says it "outperforms some specialist models more than twice its size". That's true, but the word *some* is doing a lot of work. Here is the same data with the closest open competitors I could find, each at roughly its weight class:

| Benchmark | EmbeddingGemma 2 | EmbeddingGemma 1 (300M) | Qwen3-Embedding (0.6B) | VLM2Vec-V2 (2B) | Qwen3-VL-Embedding (2B) |
| --- | --- | --- | --- | --- | --- |
| MTEB Multilingual v2 | 61.36 | 61.15 | **64.33** | — | 63.87 |
| MTEB English v2 | 68.46 | 69.67 | **70.70** | — | — |
| MTEB Code v1 | **78.68** | 68.76 | 75.41 | — | — |
| MMEB v2 Image | 57.28 | — | — | 64.9 | **75.0** |
| MMEB v2 Video | 50.67 | — | — | 34.6 | **61.9** |
| MMEB v2 Visual docs | 67.84 | — | — | 69.2 | **79.2** |
| MMEB v2 Overall | 59.01 | — | — | 59.2 | **73.2** |
| Audio (MSEB retrieval, MRR@10) | 69.54 | — | — | — | — |

My read:

1. **Code is the real win.** +9.9 points over its predecessor and +3.3 over Qwen3-Embedding-0.6B, from a 270M text path. For code it also edges out the original Gemini Embedding API model (74.66), on the same benchmark. If you index repositories for a coding agent on a laptop, this is now the default to beat.
2. **Video is the second win.** At 0.74B it beats the 2B VLM2Vec-V2 on video by 16 points and ties it overall. This is where the shared-sequence design pays off: frames are just more tokens for the same backbone.
3. **General text is flat to slightly worse.** Multilingual moved +0.2; English lost 1.2 points against version 1. If your workload is plain text retrieval and you can afford 0.6B params, Qwen3-Embedding-0.6B is still stronger, with a 32K context.
4. **Images are not its strength.** Qwen3-VL-Embedding-2B leads by ~18 points on MMEB image tasks. But it's 2.7× bigger, covers 30+ languages instead of 100+, and has no audio.
5. **Audio has no fair comparison yet.** No other open model in this size class embeds raw speech and sound into the same space as text and images, so the MSEB/MAEB numbers have nothing to line up against. In practice, the competition is "transcribe with Whisper, then embed the text", which loses non-speech sound entirely.

One caveat. The EmbeddingGemma numbers come from Google's model cards. The Qwen3-Embedding text numbers come from the Qwen3 Embedding paper, and the MMEB numbers for VLM2Vec-V2 and Qwen3-VL-Embedding come from the Qwen3-VL-Embedding card, which re-evaluated part of MMEB (the VisDoc OOD split). Different harnesses can move scores by a point or two, so I'd treat any gap under ~2 points as a tie and evaluate on your own data before switching.

So EmbeddingGemma 2 doesn't win by topping every leaderboard. It wins by **covering five input types in one space, at a size and license you can ship inside an app.**

## Matryoshka: store less, lose little

![Animation: a 768-dimensional vector bar shrinks to 512, 256 and 128 dimensions. A storage meter for one million bf16 vectors drops from 1.5 GB to 1.0, 0.5 and 0.25 GB, while MTEB Multilingual quality goes from 61.36 to 61.17, 60.41 and 57.89.](/blog/media/embeddinggemma-2-multimodal-embeddings/matryoshka.gif)

Matryoshka Representation Learning trains the model so that the first $d$ dimensions of the vector are a usable embedding on their own. Storage scales linearly with dimension. At 2 bytes per value in bf16:

$$
\text{bytes} = N \times d \times 2 \quad\Rightarrow\quad 10^6 \times 768 \times 2 \approx 1.5\ \text{GB}, \qquad 10^6 \times 128 \times 2 \approx 0.25\ \text{GB}
$$

The quality cost depends heavily on the modality:

| Dim | Storage (1M vectors, bf16) | MTEB Multilingual | MTEB Code | MMEB v2 Overall | MSEB (audio) |
| --- | --- | --- | --- | --- | --- |
| 768 | 1.5 GB | 61.36 | 78.68 | 59.01 | 69.54 |
| 512 | 1.0 GB | 61.17 | 77.24 | 58.38 | 69.18 |
| 256 | 0.5 GB | 60.41 | 76.18 | 56.24 | 66.76 |
| 128 | 0.25 GB | 57.89 | 71.41 | 45.65 | 56.71 |

**256 is the sweet spot**: about 98% of text quality at a third of the storage. **128 is a trap for multimodal**: MMEB drops 13 points and audio retrieval 13 points. Google's own guidance says 128 is best suited to text-only workloads, and the table agrees.

## Use cases where it fits

- **On-device RAG.** Quantized, the text path runs in ~191 MB of RAM on a Pixel 11 Pro by Google's numbers (~567 MB for full multimodal), and it shares a tokenizer and audio encoder with Gemma 4. A phone or laptop can embed, retrieve and generate without a network call, which matters for private notes, mail, health or legal documents.
- **Code search for agents.** The best code score in its class, 8K context (whole files, not 512-token shards), and a dedicated `CodeRetrieval` prefix. Index a repo locally and give your coding agent semantic search over it without shipping source to an API.
- **Media libraries.** Search photos, screenshots, scanned documents and short clips with plain text. Google's Edge Gallery demos ("Instant Media Search", "Video Moments Finder") do exactly this on a phone.
- **Audio archives and meetings.** Embed recordings directly and query them with text: podcasts, call-center audio, field recordings. Because there's no ASR step, you can find a siren, applause or a dog barking as well as spoken words.
- **Routing and classification at the edge.** Embed the candidate labels once, then classify incoming text, images or sounds by nearest neighbor. Google reports under 100 ms to score 500 options with its MediaPipe Decision task.
- **Cross-modal dedup and recommendations.** One space means "find the product page whose photos match this video" is a nearest-neighbor query, not a pipeline.

Where I would *not* use it: high-throughput, text-only server search where a 4B–8B text embedder fits your latency budget, and image-heavy retrieval where you can afford Qwen3-VL-Embedding-2B.

## Download and run it

The weights are on [Hugging Face](https://huggingface.co/google/embeddinggemma-2) (also on [Kaggle](https://www.kaggle.com/models/google/embeddinggemma-2)). The full multimodal checkpoint is a single 1.49 GB `model.safetensors` in bf16. No token is needed:

```bash
pip install -U "huggingface_hub[cli]"
hf download google/embeddinggemma-2 --local-dir ./embeddinggemma-2
```

You can skip the explicit download: the first `SentenceTransformer("google/embeddinggemma-2")` call pulls it into the HF cache.

### Text and code with sentence-transformers

You need `sentence-transformers>=6.1.0` (older versions ignore the order of multimodal inputs) and a Transformers release with the `embedding_gemma2` architecture; 5.19 has it. Install the extras for the modalities you plan to use:

```bash
pip install -U "sentence-transformers[image,audio,video]>=6.1.0" "transformers>=5.19" torch
```

Load only the text path (270M) and pick a dtype that won't overflow:

```python title="search.py"
import torch
from sentence_transformers import SentenceTransformer

dtype = torch.bfloat16 if torch.cuda.is_available() and torch.cuda.is_bf16_supported() else torch.float32

model = SentenceTransformer(
    "google/embeddinggemma-2",
    model_kwargs={"torch_dtype": dtype},
    config_kwargs={"vision_config": None, "audio_config": None},  # text-only: 270M
)

query = "Which planet is known as the Red Planet?"
docs = [
    "Venus is often called Earth's twin because of its similar size and proximity.",
    "Mars, known for its reddish appearance, is often referred to as the Red Planet.",
    "Jupiter, the largest planet in our solar system, has a prominent red spot.",
]

q = model.encode(query, prompt_name="SearchQuery")  # "task: search result | query: …"
d = model.encode(docs, prompt_name="Document")      # "title: none | text: …"
print(model.similarity(q, d))  # highest score on the Mars sentence
```

For code, swap the query prompt and put the filename in the document title:

```python
q = model.encode("parse an ISO date string", prompt_name="CodeRetrieval")
d = model.encode([
    "title: dates.py | text: def parse(s):\n    return datetime.fromisoformat(s)",
    "title: http.py | text: def get(url):\n    return requests.get(url, timeout=10).json()",
])
```

Dropping `vision_config` and `audio_config` gives you the 270M model. Keep the vision config and drop only audio to get the 440M text + image bundle.

### Images, audio and video in the same space

Load the full model and pass media as dicts. Media takes no prefix; the text queries still do:

```python title="cross_modal.py"
import numpy as np
import torch
from sentence_transformers import SentenceTransformer

model = SentenceTransformer("google/embeddinggemma-2", model_kwargs={"torch_dtype": torch.bfloat16})  # float32 on CPU

queries = model.encode(
    ["cats sleeping on a couch", "a president's speech about serving your country", "a turtle swimming in the ocean"],
    prompt_name="SearchQuery",
)
media = np.stack([
    model.encode({"image": "cats.jpg"}),
    model.encode({"audio": "jfk.wav"}),          # mono 16 kHz
    model.encode({"video": "sea-turtle.mp4"}),   # sampled at 1 fps
])
print(model.similarity(media, queries))  # rows: image, audio, video
```

The [ONNX model card](https://huggingface.co/onnx-community/embeddinggemma-2-ONNX) runs the same experiment with the same three files and queries (in transformers.js, with 4-bit weights). Each input scores highest against its own query: 0.740 for the image, 0.763 for the audio and 0.731 for the video, with 0.46–0.51 for the mismatched pairs. A text query finding a speech clip with no transcript in between is the whole point of the model.

Interleaving works too. Use placeholder tokens in the text and the call returns **one** vector for the whole listing:

```python
listing = model.encode({
    "text": "Waterproof running shoes. <|image|> Breathable mesh upper. <|image|> Grip test on wet rock: <|video|>",
    "image": ["shoe.jpg", "mesh.jpg"],
    "video": "demo.mp4",
})
```

### Truncate with Matryoshka

```python
query_emb = model.encode(
    "laptop overheating while charging",
    prompt_name="SearchQuery",
    truncate_dim=256,          # 768, 512, 256 or 128
    normalize_embeddings=True, # re-normalize after truncating
)
```

Queries and documents must use the **same** dimension. If you truncate by hand, call L2-normalize afterwards: a sliced unit vector is no longer unit length, and cosine scores degrade quietly instead of failing.

### Other runtimes

| Runtime | Artifact | Notes |
| --- | --- | --- |
| Ollama | `ollama pull embeddinggemma-2:270m` (also `:440m`, `:570m`, `:740m`) | `POST /api/embed`; text and images |
| llama.cpp | [`ggml-org/embeddinggemma-2-GGUF`](https://huggingface.co/ggml-org/embeddinggemma-2-GGUF) | BF16 and Q8_0 (310 MB); the vision and audio encoders ship as a separate `mmproj` file |
| Browser / Node | [`onnx-community/embeddinggemma-2-ONNX`](https://huggingface.co/onnx-community/embeddinggemma-2-ONNX) | transformers.js, WebGPU, `dtype: "q4"` |
| Apple silicon | [`mlx-community/embeddinggemma-2-*`](https://huggingface.co/mlx-community/embeddinggemma-2-bf16) | bf16 down to 4-bit and mxfp4 |
| Android / edge | [`litert-community/embeddinggemma-2-*-litert-lm`](https://huggingface.co/litert-community) | 270M, 440M and 740M bundles for LiteRT-LM |
| Servers | vLLM, SGLang, Transformers | Same Hub ID |
| Vector DB | [Qdrant](https://qdrant.tech/blog/embeddinggemma-2) | Native integration |
| Fine-tuning | [Unsloth](https://unsloth.ai/docs/models/embeddinggemma-2), sentence-transformers | Fine-tune on your own query/document pairs |

In the browser it's a few lines with transformers.js:

```js
import { pipeline } from "@huggingface/transformers";

const embed = await pipeline("feature-extraction", "onnx-community/embeddinggemma-2-ONNX", {
  device: "webgpu",
  dtype: "q4",
});
const out = await embed(
  ["task: search result | query: red planet", "title: none | text: Mars is often called the Red Planet."],
  { pooling: "mean", normalize: true },
);
```

## Gotchas I'd put on a sticky note

- **No `float16`.** Activations overflow fp16 range and the model returns NaNs or degraded vectors **without raising**. Use `bfloat16` where the hardware supports it, `float32` elsewhere (most CPUs).
- **Prefixes matter for text, never for media.** Omitting them still works, just worse. `prompt_name="Document"` hardcodes `title: none`; if you have real titles, format `title: {t} | text: {doc}` yourself.
- **Budget the 8K context.** A long video or a podcast episode won't fit in one input. Chunk by scene or by ~5-minute audio windows and store one vector per chunk.
- **Pin the dimension per index.** Mixing 768-d and 256-d vectors in one collection breaks similarity. Choose one dimension per collection and record it next to the model ID.
- **Re-embed when you upgrade.** EmbeddingGemma 1 and 2 vectors live in different spaces. Moving to v2 means re-indexing, not mixing.

## Closing thought

The headline number for EmbeddingGemma 2 isn't a benchmark. It's that one Apache-licensed model under 1B parameters now covers retrieval across text, code, images, video and audio, and the quantized text path alone fits in a couple hundred megabytes. It doesn't beat the best specialist in every column. It is good enough in most of them, best-in-class on code, and it replaces three or four models with one. For on-device and local-first retrieval, that's the trade I'd take.

---

**Further reading**

- [EmbeddingGemma 2 launch post](https://blog.google/innovation-and-ai/technology/developers-tools/embeddinggemma-2/), Google
- [Model card on Hugging Face](https://huggingface.co/google/embeddinggemma-2) and [official documentation](https://ai.google.dev/gemma/docs/embeddinggemma)
- [EmbeddingGemma 2: the developer guide](https://developers.googleblog.com/en/embeddinggemma-2-the-developer-guide), Google for Developers
- [Google AI Edge with EmbeddingGemma 2](https://developers.googleblog.com/google-ai-edge-with-embeddinggemma-2): on-device numbers and demos
- [EmbeddingGemma: Powerful and Lightweight Text Representations](https://arxiv.org/abs/2509.20354): the version 1 paper
- [Qwen3 Embedding](https://arxiv.org/abs/2506.05176) and [Qwen3-VL-Embedding](https://arxiv.org/abs/2601.04720): the comparison baselines
- [Matryoshka Representation Learning](https://arxiv.org/abs/2205.13147), Kusupati et al.
