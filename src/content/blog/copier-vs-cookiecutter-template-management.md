---
title: "Copier vs. Cookiecutter: why your project templates should be living, not frozen"
description: "A hands-on comparison of Copier and Cookiecutter for project scaffolding. Why Copier's update story makes it the right default for long-lived templates, with examples, migration notes, and trade-offs."
date: "2026-04-28"
category: "Tooling"
tags: ["python", "copier", "cookiecutter", "templates", "scaffolding", "devtools"]
featured: true
author: "Joel Perca"
---

Every team I've joined eventually accumulates a "new service" template — a `cookiecutter-*` repo, a `create-app` script, or a Notion page titled "Bootstrapping checklist (read this first)". The goal is always the same: turn a 200-line list of conventions into one command. The hard part isn't writing the template; it's keeping every project that came out of it from drifting away the moment the template evolves.

[Cookiecutter](https://github.com/cookiecutter/cookiecutter) was the de-facto answer in Python land for a decade. [Copier](https://copier.readthedocs.io/) is the one I now reach for. After migrating three internal templates and a couple of dozen downstream projects, the difference is stark — and it has very little to do with syntax.

## TL;DR

- **Cookiecutter** generates a project from a template **once**. After that, the template and the generated project are unrelated files on disk.
- **Copier** does the same, but also **records the answers and the template version** in a `.copier-answers.yml` file, so you can `copier update` a project years later and merge in template changes via three-way diffs.
- Copier's config is **YAML with typed questions, validators, and conditional logic**, instead of Cookiecutter's flat `cookiecutter.json`.
- Copier supports **migrations** (scripts that run between template versions), **multiple template inheritance**, and **non-Python templates** out of the box.
- Cookiecutter still wins on **ecosystem reach**: the public template catalog is enormous, and many tools (e.g. `cruft`) exist precisely to bolt Copier-style updates onto Cookiecutter.

## The real problem: drift

A template is a contract between "how we start a service today" and "how every service we've ever shipped is structured". Both sides keep changing:

- The template adds a CI step, a new linter, a security header, a typed config loader.
- The project adds business logic, custom routes, internal exceptions.

With Cookiecutter, after `cookiecutter gh:org/template`, the connection is severed. Updating an old service to match the new template means manually re-running the generator into a temp dir and `diff`-ing twenty files by hand. In practice nobody does this, so every service ages independently and the "template" stops describing reality after a quarter.

Copier treats the template as a **dependency**, not a one-shot generator. The generated project remembers where it came from and which version it was created against, the same way a `package.json` remembers a library version.

## Anatomy of a Copier template

A minimal template looks like this:

```
my-template/
├── copier.yml
├── README.md.jinja
├── pyproject.toml.jinja
└── src/
    └── {{ package_name }}/
        └── __init__.py.jinja
```

`copier.yml` declares the questions and metadata:

```yaml
_min_copier_version: "9.0.0"
_subdirectory: "."
_templates_suffix: ".jinja"

project_name:
  type: str
  help: Human-readable project name

package_name:
  type: str
  help: Python package name (snake_case)
  default: "{{ project_name | lower | replace(' ', '_') }}"
  validator: >-
    {% if not (package_name | regex_search('^[a-z][a-z0-9_]*$')) %}
    Must be a valid Python identifier in snake_case.
    {% endif %}

python_version:
  type: str
  choices:
    - "3.11"
    - "3.12"
    - "3.13"
  default: "3.12"

use_docker:
  type: bool
  default: true
```

Three things to notice:

1. **Types and validators** — questions are typed and can validate themselves. Cookiecutter's `cookiecutter.json` is a flat dict of strings, with validation handled in `hooks/pre_gen_project.py` if at all.
2. **Computed defaults** — `package_name` derives from `project_name`. With Cookiecutter you express this via `{{ cookiecutter.project_name|lower|replace(' ', '_') }}` in the JSON, which works but is hard to validate.
3. **Conditional rendering** — files and directories whose names depend on `{% if use_docker %}…{% endif %}` are skipped entirely when the answer is false.

## The killer feature: `copier update`

Generate a project:

```bash
copier copy gh:org/my-template ./my-service
```

This writes the files **and** a `.copier-answers.yml` snapshot:

```yaml
_commit: v1.4.0
_src_path: gh:org/my-template
project_name: My Service
package_name: my_service
python_version: "3.12"
use_docker: true
```

Six months later, the template ships a v1.5.0 with a new `Dockerfile`, a tightened `ruff` config, and a renamed setting. Inside the project:

```bash
copier update
```

Copier:

1. Fetches the new template revision.
2. Re-renders against the **stored answers** (asking only for new questions).
3. Computes a three-way diff: `(old template render) → (new template render)` vs. the project's current files.
4. Applies non-conflicting changes automatically and writes `.rej` / conflict markers for the rest, exactly like a `git merge`.

This is the workflow I never had with Cookiecutter. The closest equivalent is [cruft](https://cruft.github.io/cruft/), which retrofits an answers file and a diff-based update onto Cookiecutter. It works, but it's a community shim around a generator that was never designed to be re-runnable. Copier was built around the update path from day one.

## Migrations between versions

When the template renames `app/settings.py` → `app/config.py`, a pure diff isn't enough — you want to *move* the user's existing file, not delete it and create an empty one. Copier supports per-version migrations:

```yaml
_migrations:
  - version: v2.0.0
    before:
      - command: ["git", "mv", "app/settings.py", "app/config.py"]
    after:
      - command: ["python", "scripts/rewrite_imports.py"]
```

`before` runs against the *old* render, `after` against the *new* one. The result is a clean update even across breaking template changes. Cookiecutter has nothing like this.

## Side-by-side comparison

| Capability                            | Cookiecutter             | Copier                   |
| ------------------------------------- | ------------------------ | ------------------------ |
| Generate a project once               | yes                      | yes                      |
| Update an existing project            | no (use `cruft`)         | **yes, first-class**     |
| Typed questions / validators          | manual, via hooks        | **yes, in YAML**         |
| Conditional files & directories       | via hook scripts         | **yes, declaratively**   |
| Migrations between template versions  | no                       | **yes**                  |
| Template inheritance / composition    | limited                  | **yes (`tasks`, `_subdirectory`, multiple templates)** |
| Pre/post-gen hooks                    | yes (Python)             | yes (any shell command)  |
| Non-Python templates                  | yes                      | yes                      |
| Public template catalog               | **huge**                 | growing                  |
| Engine                                | Jinja2                   | Jinja2                   |

## Day-to-day workflow

### Bootstrap a new service

```bash
pipx install copier   # or: uv tool install copier
copier copy gh:org/service-template ./payments-api
cd payments-api
git init && git add . && git commit -m "Bootstrap from service-template v1.4.0"
```

The first commit captures the template version. From then on, `copier update` is just another PR.

### Update across the fleet

A small loop is enough to keep N services in sync:

```bash
for repo in $(gh repo list org --json name -q '.[].name' | grep '^svc-'); do
  git clone "git@github.com:org/$repo" && cd "$repo"
  copier update --defaults --vcs-ref=v1.5.0
  git checkout -b template/v1.5.0
  git commit -am "chore: bump service-template to v1.5.0"
  gh pr create --fill
  cd ..
done
```

`--defaults` reuses the stored answers without re-prompting; `--vcs-ref` pins the target version. This is a fleet-wide template upgrade in one script — the kind of thing you simply cannot do with vanilla Cookiecutter.

### Local iteration on the template itself

```bash
copier copy --vcs-ref=HEAD ./my-template /tmp/check
copier update --vcs-ref=HEAD /tmp/check   # exercise the update path
```

Pointing at a local path with `--vcs-ref=HEAD` lets you smoke-test the template against an in-progress branch before pushing.

## Where Cookiecutter still wins

- **Discovery.** The public ecosystem (`cookiecutter-django`, `cookiecutter-pypackage`, `cookiecutter-data-science`, …) is huge and battle-tested. If you just want a one-off scaffold and never plan to update, Cookiecutter is fine — and probably already pinned in your team's docs.
- **Familiarity.** Most Python developers have used it at least once. Onboarding cost for Copier is small but non-zero.
- **Hook flexibility.** `pre_gen_project.py` and `post_gen_project.py` are arbitrary Python; Copier's `_tasks` are shell commands, which is usually enough but occasionally less ergonomic.

If you need updates on top of a Cookiecutter template you already own, [cruft](https://cruft.github.io/cruft/) is the pragmatic answer and worth knowing about. It stores `.cruft.json` and exposes `cruft update` with a similar three-way merge. I've shipped both; Copier still feels less like a workaround.

## Migration recipe (Cookiecutter → Copier)

Migration is mostly mechanical:

1. Rename `cookiecutter.json` → `copier.yml`, convert each entry to a typed question.
2. Replace `{{ cookiecutter.x }}` with `{{ x }}` across the template (Copier does not namespace variables).
3. Rename templated files to `*.jinja` and set `_templates_suffix: ".jinja"` in `copier.yml`.
4. Convert `hooks/pre_gen_project.py` and `hooks/post_gen_project.py` into entries under `_tasks` (or keep them as scripts the tasks invoke).
5. Tag a `v1.0.0` on the template. Future bumps become meaningful update targets.
6. For existing downstream projects, generate a `.copier-answers.yml` by hand (or via `cruft`'s migration tooling) so they can opt into `copier update`.

Most teams I've helped do this finish in a day for the template itself, then trickle in the answers files as projects come up for maintenance.

## When I'd still pick neither

- **Tiny one-file scaffolds.** A `bash` script with `sed` or a `gh repo create --template` repo is sometimes enough.
- **Polyglot monorepos with very different stacks.** Tools like [Yeoman](https://yeoman.io/) (JS) or [Nx generators](https://nx.dev/) live closer to the build system and may integrate better.
- **Fully managed platforms.** If your platform team already provides a paved-road generator (Backstage, internal CLIs), use that — and lobby for Copier-style updates underneath.

## Closing thought

A template is not a one-shot script; it's a long-lived contract. Cookiecutter was built when the contract was "give me a starting point", and it's excellent at that. Copier is built for the world where the contract is "and keep this project aligned with the org's conventions for the next five years".

Once you internalize the update path, you stop writing READMEs full of "remember to also add X" and start landing them as PRs across the fleet with a single `copier update`. That's a different kind of leverage — and the reason I won't go back.

---

**Further reading**

- [Copier documentation](https://copier.readthedocs.io/) — the canonical reference, including the update model and migrations.
- [Cookiecutter documentation](https://cookiecutter.readthedocs.io/).
- [cruft](https://cruft.github.io/cruft/) — Copier-style updates retrofitted onto Cookiecutter templates.
