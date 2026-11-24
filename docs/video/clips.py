#!/usr/bin/env python3
"""Build docs/video/clips/*.mp4 from the Lens Studio Preview frames in docs/video/frames/<scene>/.

The frames are real grabs of the Preview panel (capture_preview.ts, run through the Lens Studio MCP
ExecuteEditorCode while each LEAF scenario ran). times.txt holds the real capture time of each frame.
Each frame is shown for exactly its real interval and re-timed to 30 fps by repeating frames: no
interpolation. The window length equals the narration length (+0.6 s pad that demo_slides adds), so
demo_slides plays the clip at 1.0x.

Usage: python3 docs/video/clips.py   (then demo_slides.py docs/video/demo.json)
"""
import json, os, pathlib, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont

BASE = pathlib.Path(__file__).resolve().parent
W, H = 1920, 1080
HELV, MENLO = "/System/Library/Fonts/HelveticaNeue.ttc", "/System/Library/Fonts/Menlo.ttc"
CROP = "crop=1480:800:260:387"  # Preview render area around the slab, toolbar and LEAF banner left out
CW, CH, CX, CY = 1536, 830, 192, 190


def narration_len(cfg, sc, tmp):
    aiff = tmp / "n.aiff"
    sys.path.insert(0, os.path.expanduser("~/Dev/clauditor/skills/video-editing/scripts"))
    from demo_slides import narrate  # same voice (and cache) as the final render
    narrate(cfg, sc["say"], aiff)
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of",
                                          "csv=p=0", str(aiff)], text=True)) + 0.6


def background(cfg, sc, path):
    im = Image.new("RGB", (W, H), cfg.get("bg", "#0f1b2d"))
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 10], fill=cfg.get("accent", "#2563eb"))
    d.text((110, 38), sc["title"], font=ImageFont.truetype(HELV, 58, index=1), fill="white")
    d.text((110, 118), sc["rec_note"], font=ImageFont.truetype(HELV, 32), fill="#dbe5f3")
    d.rectangle([CX - 2, CY - 2, CX + CW + 1, CY + CH + 1], outline="#33507a", width=2)
    foot = f"{cfg['brand']} · screen recording, real time, {sc['rec_leaf']}"
    d.text((110, H - 46), foot, font=ImageFont.truetype(MENLO, 22), fill="#7f93b0")
    im.save(path)


def build(cfg, sc, tmp):
    frames = BASE / sc["rec"]
    rows = [l.split() for l in (frames / "times.txt").read_text().splitlines()]
    t0 = float(sc["rec_from"])
    dur = narration_len(cfg, sc, tmp)
    t1 = t0 + dur
    pts = [(frames / n, float(t)) for n, t in rows]
    keep = [i for i, (_, t) in enumerate(pts) if t0 <= t < t1]
    assert keep and pts[keep[-1]][1] < t1 <= pts[-1][1] + 0.5, f"{sc['rec']}: window {t0:.2f}-{t1:.2f} not covered"
    if keep[0] > 0:  # the frame on screen at t0
        keep.insert(0, keep[0] - 1)
    lst = tmp / "list.txt"
    with lst.open("w") as f:
        for k, i in enumerate(keep):
            start = max(pts[i][1], t0)
            end = pts[keep[k + 1]][1] if k + 1 < len(keep) else t1
            f.write(f"file '{pts[i][0]}'\nduration {end - start:.4f}\n")
        f.write(f"file '{pts[keep[-1]][0]}'\n")
    bg = tmp / "bg.png"
    background(cfg, sc, bg)
    out = BASE / sc["clip"]
    out.parent.mkdir(exist_ok=True)
    graph = f"[1:v]{CROP},scale={CW}:{CH},fps=30[c];[0:v][c]overlay={CX}:{CY},format=yuv420p[v]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-i", bg, "-f", "concat", "-safe", "0",
                    "-i", lst, "-filter_complex", graph, "-map", "[v]", "-t", f"{dur:.3f}", "-r", "30",
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", out], check=True)
    secs = pts[keep[-1]][1] - pts[keep[0]][1]
    print(f"{out.name}: {len(keep)} real frames over {dur:.2f} s ({(len(keep) - 1) / max(secs, 1e-6):.1f} fps captured)")


if __name__ == "__main__":
    cfg = json.loads((BASE / "demo.json").read_text())
    with tempfile.TemporaryDirectory() as t:
        for sc in cfg["scenes"]:
            if sc.get("rec"):
                build(cfg, sc, pathlib.Path(t))
