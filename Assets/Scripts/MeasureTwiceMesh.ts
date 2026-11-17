// MeasureTwiceMesh — tiny MeshBuilder helper for flat line art in the XZ plane (y = lift).
// Owns: quads, line segments, closed loops, filled rects, discs, rings, triangles.
// Materials are expected to be two-sided, so winding does not matter.
// Must not: create SceneObjects or hold state beyond the mesh being built.

import {Point2} from "./MeasureTwiceLayout"

export class FlatMesh {
  private mb: MeshBuilder
  private count = 0

  constructor(private lift: number = 0) {
    this.mb = new MeshBuilder([
      {name: "position", components: 3},
      {name: "normal", components: 3, normalized: true},
      {name: "texture0", components: 2}
    ])
    this.mb.topology = MeshTopology.Triangles
    this.mb.indexType = MeshIndexType.UInt16
  }

  private vert(x: number, z: number): number {
    this.mb.appendVerticesInterleaved([x, this.lift, z, 0, 1, 0, 0, 0])
    return this.count++
  }

  quad(a: Point2, b: Point2, c: Point2, d: Point2): this {
    const i = this.vert(a.x, a.z)
    this.vert(b.x, b.z)
    this.vert(c.x, c.z)
    this.vert(d.x, d.z)
    this.mb.appendIndices([i, i + 1, i + 2, i, i + 2, i + 3])
    return this
  }

  triangle(a: Point2, b: Point2, c: Point2): this {
    const i = this.vert(a.x, a.z)
    this.vert(b.x, b.z)
    this.vert(c.x, c.z)
    this.mb.appendIndices([i, i + 1, i + 2])
    return this
  }

  /** Straight line of width w, extended by w/2 at both ends so loop joints close. */
  segment(a: Point2, b: Point2, w: number): this {
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.sqrt(dx * dx + dz * dz)
    if (len < 1e-6) return this
    const ux = dx / len
    const uz = dz / len
    const e = w / 2
    const px = -uz * e
    const pz = ux * e
    const a2 = {x: a.x - ux * e, z: a.z - uz * e}
    const b2 = {x: b.x + ux * e, z: b.z + uz * e}
    return this.quad(
      {x: a2.x + px, z: a2.z + pz},
      {x: b2.x + px, z: b2.z + pz},
      {x: b2.x - px, z: b2.z - pz},
      {x: a2.x - px, z: a2.z - pz}
    )
  }

  loop(pts: Point2[], w: number, offset: Point2 = {x: 0, z: 0}, scale = 1): this {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % pts.length]
      this.segment(
        {x: offset.x + a.x * scale, z: offset.z + a.z * scale},
        {x: offset.x + b.x * scale, z: offset.z + b.z * scale},
        w
      )
    }
    return this
  }

  rect(x0: number, z0: number, x1: number, z1: number): this {
    return this.quad({x: x0, z: z0}, {x: x1, z: z0}, {x: x1, z: z1}, {x: x0, z: z1})
  }

  disc(c: Point2, r: number, n = 24): this {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2
      const a1 = ((i + 1) / n) * Math.PI * 2
      this.triangle(c, {x: c.x + Math.cos(a0) * r, z: c.z + Math.sin(a0) * r}, {x: c.x + Math.cos(a1) * r, z: c.z + Math.sin(a1) * r})
    }
    return this
  }

  ring(c: Point2, r: number, w: number, n = 32): this {
    const pts: Point2[] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      pts.push({x: Math.cos(a) * r, z: Math.sin(a) * r})
    }
    return this.loop(pts, w, c)
  }

  build(): RenderMesh {
    this.mb.updateMesh()
    return this.mb.getMesh()
  }
}

/** Two-sided unlit clone of `base` tinted `color`. */
export function tintedMaterial(base: Material, color: vec4): Material {
  const m = base.clone()
  m.mainPass.baseColor = color
  m.mainPass.twoSided = true
  return m
}

/** Child SceneObject with a RenderMeshVisual. */
export function meshObject(parent: SceneObject, name: string, mesh: RenderMesh, material: Material): SceneObject {
  const so = global.scene.createSceneObject(name)
  so.setParent(parent)
  const rmv = so.createComponent("Component.RenderMeshVisual") as RenderMeshVisual
  rmv.mesh = mesh
  rmv.mainMaterial = material
  return so
}
