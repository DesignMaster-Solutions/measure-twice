// MeasureTwiceLayout — pure data + geometry math for Measure Twice (no scene access).
// Owns: sample sink table, slab size, rail math, clamp, mark points, outline points, summary text.
// Coordinates are slab-top local, in cm: x right, z toward the user (front edge at +SLAB_D/2), y up.
// Must not: touch SceneObjects, components or UI.

export type SinkShape = "oval" | "rect"

export interface Sink {
  name: string
  shape: SinkShape
  w: number // cutout width along slab length (cm)
  h: number // cutout depth front-to-back (cm)
  radius: number // corner radius for rect (cm)
  inches: string
}

// Sample sizes from the design brief (not a manufacturer's template).
export const SINKS: Sink[] = [
  {name: "Oval", shape: "oval", w: 43, h: 36, radius: 0, inches: "17 x 14 in"},
  {name: "Rectangle", shape: "rect", w: 46, h: 33, radius: 2, inches: "18 x 13 in"},
  {name: "Large rectangle", shape: "rect", w: 53, h: 38, radius: 2, inches: "21 x 15 in"}
]

export const SLAB_W = 122
export const SLAB_D = 56
export const SLAB_T = 3
export const FAUCET_DIAMETER = 3.5
export const FAUCET_GAP = 5 // gap between cutout back edge and faucet hole edge
/** Extra x offset for the back rail label: the faucet hole sits on the back dimension line, mid-rail. */
export const BACK_LABEL_SHIFT = FAUCET_DIAMETER / 2 + 1

export interface Rails {
  front: number
  back: number
  left: number
  right: number
}

export interface Point2 {
  x: number
  z: number
}

/** Distance from the cutout centre to the faucet-hole centre (behind the cutout, -z). */
export function faucetOffset(s: Sink): number {
  return s.h / 2 + FAUCET_GAP + FAUCET_DIAMETER / 2
}

export function railsFor(s: Sink, x: number, z: number): Rails {
  return {
    front: SLAB_D / 2 - (z + s.h / 2),
    back: z - s.h / 2 + SLAB_D / 2,
    left: x - s.w / 2 + SLAB_W / 2,
    right: SLAB_W / 2 - (x + s.w / 2)
  }
}

/** Keeps the cutout and the faucet hole on the slab. */
export function clampPosition(s: Sink, x: number, z: number): Point2 {
  const maxX = SLAB_W / 2 - s.w / 2
  const minZ = -SLAB_D / 2 + faucetOffset(s) + FAUCET_DIAMETER / 2
  const maxZ = SLAB_D / 2 - s.h / 2
  return {x: Math.min(maxX, Math.max(-maxX, x)), z: Math.min(maxZ, Math.max(minZ, z))}
}

/** Start position: centred left-right, front rail equal to back rail (clamped for the faucet hole). */
export function startPosition(s: Sink): Point2 {
  return clampPosition(s, 0, 0)
}

/** The five pencil marks in order: four corners (oval: front, right, back, left) then the faucet hole. Template-local. */
export function markPoints(s: Sink): Point2[] {
  const hw = s.w / 2
  const hh = s.h / 2
  const corners =
    s.shape === "oval"
      ? [{x: 0, z: hh}, {x: hw, z: 0}, {x: 0, z: -hh}, {x: -hw, z: 0}]
      : [{x: -hw, z: hh}, {x: hw, z: hh}, {x: hw, z: -hh}, {x: -hw, z: -hh}]
  corners.push({x: 0, z: -faucetOffset(s)})
  return corners
}

/** Closed outline polyline, template-local. */
export function outlinePoints(s: Sink): Point2[] {
  const pts: Point2[] = []
  const hw = s.w / 2
  const hh = s.h / 2
  if (s.shape === "oval") {
    const n = 72
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      pts.push({x: Math.cos(a) * hw, z: Math.sin(a) * hh})
    }
    return pts
  }
  const r = s.radius
  const centres = [
    {x: hw - r, z: hh - r, a0: 0},
    {x: -hw + r, z: hh - r, a0: Math.PI / 2},
    {x: -hw + r, z: -hh + r, a0: Math.PI},
    {x: hw - r, z: -hh + r, a0: (Math.PI * 3) / 2}
  ]
  for (const c of centres) {
    for (let i = 0; i <= 6; i++) {
      const a = c.a0 + (i / 6) * (Math.PI / 2)
      pts.push({x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r})
    }
  }
  return pts
}

export function fmt(v: number): string {
  return (Math.round(v * 10) / 10).toFixed(1)
}

export function isCentered(r: Rails, tolerance: number): boolean {
  return Math.abs(r.left - r.right) <= tolerance + 1e-6
}

export function summaryFor(r: Rails, centered: boolean, marks: number): string {
  const lr = centered ? "Centered" : `Off-center ${fmt(Math.abs(r.left - r.right) / 2)} cm`
  return `Front ${fmt(r.front)} cm · Back ${fmt(r.back)} cm · ${lr} · ${marks} marks`
}

/** Assert-based self-check for the math above. Returns a list of failures (empty = pass). */
export function layoutSelfCheck(): string[] {
  const fails: string[] = []
  const eq = (a: number, b: number, what: string) => {
    if (Math.abs(a - b) > 1e-6) fails.push(`${what}: ${a} != ${b}`)
  }
  const big = SINKS[2]
  const p = startPosition(big)
  const r = railsFor(big, p.x, p.z)
  eq(r.left, r.right, "start centred")
  eq(r.front + r.back + big.h, SLAB_D, "front+back+h = slab depth")
  eq(r.left + r.right + big.w, SLAB_W, "left+right+w = slab width")
  const c = clampPosition(big, 999, 999)
  eq(railsFor(big, c.x, c.z).right, 0, "clamp right edge")
  eq(railsFor(big, c.x, c.z).front, 0, "clamp front edge")
  const cb = clampPosition(big, 0, -999)
  eq(cb.z - faucetOffset(big) - FAUCET_DIAMETER / 2, -SLAB_D / 2, "clamp keeps faucet hole on slab")
  if (markPoints(SINKS[0]).length !== 5) fails.push("oval has 5 marks")
  if (summaryFor({front: 9, back: 11, left: 30, right: 30}, true, 5) !== "Front 9.0 cm · Back 11.0 cm · Centered · 5 marks")
    fails.push("summary format")
  return fails
}
