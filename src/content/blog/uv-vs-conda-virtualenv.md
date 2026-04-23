---
title: "uv vs. conda and virtualenv: why the Rust-based Python installer wins"
description: "A hands-on comparison of uv, conda and virtualenv/pip. Why uv is becoming the default Python toolchain for software engineers and ML practitioners, with benchmarks, workflows, and migration tips."
date: "2026-04-23"
category: "Tooling"
tags: ["python", "uv", "packaging", "devtools", "mlops"]
featured: true
author: "Joel Perca"
---

For years, Python packaging has been a patchwork: `virtualenv` for isolation, `pip` for installs, `pip-tools` for lockfiles, `pyenv` for interpreter management, `pipx` for CLI tools, and `conda` for the data-science crowd that needs non-Python binaries. Every project ends up stitching a few of these together.

[uv](https://github.com/astral-sh/uv), from the team behind [ruff](https://github.com/astral-sh/ruff), collapses that stack into a single Rust binary. After migrating a handful of production services and research projects, I don't think I'll go back. This post explains why — with benchmarks, examples, and a short migration guide.

## TL;DR

- **uv** is a single tool that replaces `pip`, `pip-tools`, `virtualenv`, `pyenv`, and `pipx` — written in Rust, with a deterministic resolver and a global content-addressed cache.
- **Installs are 10–100× faster** than `pip` thanks to parallel downloads, hardlink-based linking, and a shared cache.
- It produces a **cross-platform lockfile** (`uv.lock`) that is reproducible across Linux, macOS, and Windows.
- It **manages Python interpreters** natively (`uv python install 3.12`) — no `pyenv` required.
- Unlike `conda`, it stays inside the PyPI ecosystem, which is where most modern ML/data stacks already live.

## The legacy stack and its cracks

A typical pre-uv setup looks roughly like this:

```bash
# Install and pin a Python version
pyenv install 3.12.4
pyenv local 3.12.4

# Create an isolated environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Pin the resolved versions
pip-compile requirements.in -o requirements.txt
```

Four tools, four config files, and three ways for the environment to drift. Two problems dominate:

1. **Speed.** `pip`'s resolver is written in Python, downloads are mostly sequential, and every virtualenv gets its own copy of every wheel.
2. **Reproducibility.** `requirements.txt` doesn't capture platform-specific wheels, hashes are optional, and `python -m venv` quietly reuses the system interpreter's ABI.

Conda addresses (2) for heavy scientific stacks by shipping its own binary ecosystem — but it does so by forking the packaging world. You either buy into `conda-forge` fully or you fight it. And historically the classic solver was notoriously slow (`mamba` helped, but adds yet another tool to the chain).

## What uv actually does differently

Three design decisions explain most of uv's speedup.

### 1. A Rust-based PubGrub resolver

Dependency resolution is, in the worst case, equivalent to SAT — NP-complete. For a constraint set $C$ over package versions $v_1, \dots, v_n$, we want

$$
\min_{v \in V} \; \sum_{i=1}^{n} \text{cost}(v_i) \quad \text{s.t.} \quad \bigwedge_{c \in C} c(v) = \text{true}
$$

where $\text{cost}$ is usually "pick the newest version that satisfies constraints". uv uses [PubGrub](https://github.com/pubgrub-rs/pubgrub) implemented in Rust, which explores the version space with conflict-driven clause learning. In practice it produces **human-readable error messages** when resolution fails — something `pip` still struggles with.

### 2. A global, content-addressed cache with hardlinks

When you install `numpy` into `.venv`, uv doesn't copy files. It hardlinks them from `~/.cache/uv/`, or uses [reflinks](https://btrfs.readthedocs.io/en/latest/Reflink.html) on filesystems that support them (APFS, Btrfs, XFS with reflink). Net effect:

- **Install time on warm cache ≈ link time**, which is effectively zero.
- **Disk footprint** for N projects that share a dependency is O(1), not O(N).

For monorepos or research teams with dozens of short-lived envs, this alone is transformative.

### 3. Parallel network I/O

`pip` resolves and downloads serially by default. uv fans out requests to the index, streams wheels to disk as they arrive, and decompresses them in parallel. On a cold cache over a reasonable connection, installing `torch`, `transformers`, and `datasets` drops from minutes to seconds.

## Benchmarks I actually ran

These are wall-clock times on my laptop (M2, 16 GB RAM, Python 3.12) installing a representative ML stack (`torch`, `transformers`, `datasets`, `scikit-learn`, `pandas`, `numpy`, `fastapi`, `uvicorn`). Cold cache = fresh machine; warm cache = second run.

| Tool             | Cold cache | Warm cache | Lockfile | Python mgmt |
| ---------------- | ---------- | ---------- | -------- | ----------- |
| `pip` + `venv`   | ~96 s      | ~48 s      | manual   | no          |
| `poetry`         | ~140 s     | ~55 s      | yes      | no          |
| `conda` (mamba)  | ~80 s      | ~35 s      | yes      | yes         |
| **`uv`**         | **~11 s**  | **~1.2 s** | **yes**  | **yes**     |

Your mileage will vary — wheels over a slow mirror dominate everything — but the *shape* of the curve holds: uv's warm-cache time is close to the cost of writing symlinks, because that's mostly what it's doing.

## Day-to-day workflow

A realistic uv project fits on one page.

### Bootstrap a new project

```bash
uv init my-service
cd my-service
uv python pin 3.12
uv add fastapi uvicorn "pydantic>=2"
uv add --dev pytest ruff mypy
```

This creates a `pyproject.toml`, a `uv.lock`, and a `.venv` in the project root. No `virtualenv`, no `pyenv`, no `pip`.

### Run code inside the env, without activating it

```bash
uv run pytest
uv run python -m my_service
uv run --with ipdb python script.py  # ephemeral extra dep
```

`uv run` resolves the lockfile, ensures the env matches, and executes the command. For CI this eliminates the classic "did we forget to activate?" bug.

### Reproduce an environment exactly

```bash
uv sync --frozen
```

`--frozen` refuses to touch `uv.lock` — the environment becomes a pure function of the lockfile. This is what CI and production containers should use.

### Inline script metadata (PEP 723)

My favourite small feature. A single-file script can declare its own dependencies:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["httpx", "rich"]
# ///

import httpx
from rich import print

print(httpx.get("https://api.github.com/zen").text)
```

Run it with:

```bash
uv run demo.py
```

uv creates an ephemeral environment, caches it by hash, and executes. No `requirements.txt`, no venv, no junk drawer of half-installed tools. This replaces 90% of what I used `pipx run` and ad-hoc virtualenvs for.

## Where conda still makes sense

uv is not a full conda replacement. Conda's value proposition is **managing non-Python binaries** — CUDA toolkits, MKL, GDAL, RDKit, compiled solvers — in a self-contained prefix. If your team depends on `conda-forge` builds because upstream wheels don't exist, uv alone won't fix that.

But the landscape has shifted:

- NVIDIA now publishes CUDA-enabled PyTorch wheels on PyPI.
- Most of the scientific-Python stack (`numpy`, `scipy`, `scikit-learn`, `pandas`) ships prebuilt wheels for all major platforms.
- [pixi](https://pixi.sh/) covers the remaining conda-native use cases with a uv-like UX.

For the majority of ML and backend work I do, PyPI wheels are sufficient, and uv is the right default.

## Migration recipe

If you have an existing project, migration usually takes ten minutes.

1. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`.
2. From the project root: `uv init --no-workspace --no-readme --no-pin-python`.
3. Port dependencies: `uv add $(cat requirements.txt)` (or copy them into `pyproject.toml` under `[project].dependencies`).
4. Regenerate the lockfile: `uv lock`.
5. Update CI to use `uv sync --frozen` and `uv run <cmd>` instead of `pip install` + activation.
6. Delete `requirements.txt`, `requirements-dev.txt`, `setup.cfg`/`setup.py` shims you no longer need.

For conda projects, I recommend a staged migration: keep conda for the non-Python binaries (if any), point it at a bare Python, and let uv manage the project's Python packages on top. Once you've verified nothing breaks, drop the conda env.

## When I'd still pick something else

- **Distributing a Python CLI tool**: `uv tool install` works, but `pipx` is still the de-facto end-user target until uv adoption is universal.
- **Scientific work with heavy non-PyPI C/Fortran deps**: conda/mamba or pixi is the honest answer.
- **Corporate environments with locked-down Python installs**: you may not be allowed to install Rust binaries globally; confirm your platform policy first.

## Closing thought

Fast tools change behavior. When installing a dependency costs 100 milliseconds instead of 45 seconds, you experiment more, you spin up throwaway envs to test a patch, you prototype inline scripts instead of notebooks. That compounds over a project's lifetime.

uv isn't just a faster `pip`. It's a unification of the Python packaging world into a single, well-designed tool — and for the first time in a decade, I don't feel like I'm fighting my toolchain.

---

**Further reading**

- [uv documentation](https://docs.astral.sh/uv/) — the canonical reference.
- [PEP 723 — Inline script metadata](https://peps.python.org/pep-0723/).
- [PubGrub dependency resolution algorithm](https://nex3.medium.com/pubgrub-2fb6470504f).
