# Post media with HyperFrames

Read this only when the prompt asks for media: a video, animation, GIF, animated diagram, or a cover / OG image for the post. A text-only post is the default — don't add media on your own initiative, since every render costs time and HyperFrames usage.

HyperFrames renders video from HTML compositions. Everything about *how* to build one lives in the HyperFrames skills; this file only adds the constraints the blog imposes, so pass them along instead of re-deriving them.

## What the blog can actually display

The pipeline in `src/lib/blog.ts` strips raw HTML (`remark-rehype` runs without `allowDangerousHtml`), so `<video>` tags vanish from the rendered post. That leaves two deliverables:

| Deliverable | Format | Where it goes | How it's used |
| --- | --- | --- | --- |
| Inline figure (animation, animated diagram, short demo) | GIF, rendered with `--format gif --fps 15` | `public/blog/media/<slug>/<name>.gif` | `![Alt text](/blog/media/<slug>/<name>.gif)` in the body |
| Cover | 1200×630 PNG, from `npx hyperframes snapshot` | `public/blog/covers/<slug>.png` | `cover: "/blog/covers/<slug>.png"` in frontmatter |

The cover only feeds OG/Twitter cards and JSON-LD (`metadataBase` in `src/app/layout.tsx` makes the relative path absolute); it isn't shown on the card or the post page.

If the user explicitly wants MP4/WebM with real `<video>` playback, that needs `.use(remarkRehype, { allowDangerousHtml: true })` in `src/lib/blog.ts`. It's a one-line change and the content is author-controlled, but it touches the blog pipeline — ask before making it.

## Workflow

1. **Draft the post text first.** Media illustrates an argument; knowing the sections tells you which idea deserves motion and what the cover should say.
2. **Enter through `/hyperframes`.** It's the mandatory entry skill: it checks usage, runs its intent step, and routes to the right workflow (a short silent loop usually lands in `/motion-graphics`). Hand it the brief below so it doesn't re-ask what the blog already decides.
3. **Keep the project out of the app.** Scaffold under `.context/hyperframes/<slug>-<name>/` (gitignored and ignored by ESLint). Never inside `src/` or `public/` — Next would try to build or serve the composition sources.
4. **Let HyperFrames run its own gates** (lint/check, preview, approval before the final render). Don't skip them because you're inside a blog flow.
5. **Export, then copy only the final asset** into `public/blog/...`. The composition project stays local; only the GIF/PNG gets committed.
6. **Verify** (below), then reference the file from the post and run the normal `pnpm lint` + `pnpm build` gate.

## Brief to hand to HyperFrames

- **Silent.** GIFs carry no audio, so no narration, music, or SFX — the motion has to explain itself.
- **Short and loopable.** 3–8 s; end on a state that cuts cleanly back to the first frame, because the GIF loops forever.
- **Inline figures: 16:9, 960×540.** The article column is about that wide, and GIF size grows with every pixel; go to 1280×720 only for dense text or code, and only if it still fits the size budget.
- **Cover: 1200×630**, a single strong frame — post title or a key phrase plus one visual idea, readable at thumbnail size.
- **Site palette** so media feels native: ink `#0b0f14`, paper `#f6f4ef`, accent `#ff5a36`, surface `#141a21`, muted `#9aa0a8`; sans font Space Grotesk, monospace for code. A GIF can't follow the light/dark toggle, so pick one background (ink or surface reads well in both themes) and keep contrast high.
- **Flat colors over gradients, grain, or photos.** GIF uses a 256-color palette per frame; gradients band and noise explodes file size.

## Size budget

Aim for **≤ 3 MB per GIF**; the budget wins over resolution and length, because GIFs autoplay on every page view, including mobile. If a render comes out heavier, in order: shorten the loop, drop to `--fps 12`, remove gradients/texture, shrink the composition. Report the final size to the user.

## Verify

```bash
ls -lh public/blog/media/<slug>/<name>.gif public/blog/covers/<slug>.png
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,r_frame_rate public/blog/media/<slug>/<name>.gif
```

- Duration and dimensions match the brief; file is non-empty and within budget.
- Look at the cover PNG and at a mid-loop GIF frame (`ffmpeg -ss 2 -i <gif> -frames:v 1 /tmp/frame.png`) before calling it done.
- Every embedded GIF has alt text that states what the animation shows, and anything the animation *says* (labels, numbers) also appears in the prose — text inside a GIF isn't searchable or screen-reader accessible.
