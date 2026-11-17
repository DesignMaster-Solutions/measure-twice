// MeasureTwiceStoneUI — passive view of everything drawn ON the slab top.
// Owns: Template (cutout outline + centre cross + faucet hole, draggable), rail fills, dimension lines,
//       RailLabel_Front/Back/Left/Right, CornerMarker (pulsing), OffViewArrow, Summary, tick/chime audio.
// Inputs: lineMaterial (unlit, cloned per colour), tickAudio, chimeAudio, colours and sizes.
// Must not: hold domain state or decide anything. It renders a StoneView and reports drag intent via onDragTo.
// Placement: this SceneObject sits at the slab top centre; children use slab-local cm (x right, z toward user).

import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {Interactable} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {InteractorEvent} from "SpectaclesInteractionKit.lspkg/Core/Interactor/InteractorEvent"
import {fmt, outlinePoints, Point2, Rails, Sink, SLAB_D, SLAB_W, faucetOffset, FAUCET_DIAMETER} from "./MeasureTwiceLayout"
import {FlatMesh, meshObject, tintedMaterial} from "./MeasureTwiceMesh"

export interface StoneView {
  visible: boolean
  sink: Sink | null
  x: number
  z: number
  rails: Rails
  amber: {front: boolean; back: boolean; left: boolean; right: boolean}
  centered: boolean
  tracing: boolean
  marker: Point2 | null // slab-local
  arrow: {x: number; z: number; dirX: number; dirZ: number} | null // slab-local position + direction
  summary: string
  dragEnabled: boolean
}

type Side = "Front" | "Back" | "Left" | "Right"
const SIDES: Side[] = ["Front", "Back", "Left", "Right"]
const FLAT = quat.fromEulerAngles(-Math.PI / 2, 0, 0) // text lying face-up, reading from the front

@component
export class MeasureTwiceStoneUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">MeasureTwiceStoneUI – outline, rails and marks on the stone</span>')
  @ui.separator
  @ui.group_start("References")
  @input
  @hint("Unlit material cloned for every line and fill colour")
  lineMaterial: Material

  @input
  @hint("Short tick played from the next corner when it is out of view")
  tickAudio: AudioTrackAsset

  @input
  @hint("Soft chime played when the summary appears")
  chimeAudio: AudioTrackAsset
  @ui.group_end

  @ui.separator
  @ui.group_start("Settings")
  @input("vec4", "{0.2, 0.9, 1.0, 1}")
  @hint("Cutout outline colour")
  @widget(new ColorWidget())
  outlineColor: vec4 = new vec4(0.2, 0.9, 1.0, 1)

  @input("vec4", "{1.0, 0.68, 0.12, 1}")
  @hint("Rail below the shop minimum (number and filled rail)")
  @widget(new ColorWidget())
  amberColor: vec4 = new vec4(1.0, 0.68, 0.12, 1)

  @input("vec4", "{0.45, 1.0, 0.55, 1}")
  @hint("Left/right numbers when centred")
  @widget(new ColorWidget())
  centeredColor: vec4 = new vec4(0.45, 1.0, 0.55, 1)

  @input
  @hint("Outline line width in cm")
  @widget(new SliderWidget(0.2, 1.5, 0.1))
  lineWidth: number = 0.6

  @input
  @hint("Rail number text size while positioning (halved while tracing)")
  @widget(new SliderWidget(60, 240, 1))
  labelSize: number = 150

  @input
  @hint("Summary text size")
  @widget(new SliderWidget(30, 120, 1))
  summarySize: number = 80

  @input
  @hint("Corner marker diameter in cm")
  @widget(new SliderWidget(1, 6, 0.5))
  markerDiameter: number = 3
  @ui.group_end

  private _onDragTo = new Event<Point2>()
  /** Slab-local point the user is dragging the template centre to (unclamped). */
  get onDragTo(): PublicApi<Point2> {
    return this._onDragTo.publicApi()
  }

  private content: SceneObject
  private template: SceneObject
  private outline: RenderMeshVisual
  private collider: ColliderComponent
  private interactable: Interactable
  private fills: {[k: string]: SceneObject} = {}
  private dims: {[k: string]: SceneObject} = {}
  private labels: {[k: string]: Text} = {}
  private marker: SceneObject
  private arrow: SceneObject
  private summary: Text
  private tick: AudioComponent
  private chime: AudioComponent
  private builtSink: Sink | null = null
  private grabOffset = vec3.zero()
  private white = new vec4(1, 1, 1, 1)

  onAwake(): void {
    this.content = global.scene.createSceneObject("StoneContent")
    this.content.setParent(this.sceneObject)

    const unit = new FlatMesh().rect(-0.5, -0.5, 0.5, 0.5).build()
    // Fill at ~45% intensity so the amber number on top of it still reads (additive display: dimmer = fainter, never dark).
    const a = this.amberColor
    const amberMat = tintedMaterial(this.lineMaterial, new vec4(a.x * 0.45, a.y * 0.45, a.z * 0.45, 1))
    const dimMat = tintedMaterial(this.lineMaterial, new vec4(0.85, 0.95, 1, 1))
    for (const s of SIDES) {
      this.fills[s] = meshObject(this.content, `RailFill_${s}`, unit, amberMat)
      this.dims[s] = meshObject(this.content, `DimLine_${s}`, unit, dimMat)
      this.labels[s] = this.flatText(`RailLabel_${s}`, this.labelSize)
    }

    this.template = global.scene.createSceneObject("Template")
    this.template.setParent(this.content)
    this.outline = meshObject(this.template, "Outline", unit, tintedMaterial(this.lineMaterial, this.outlineColor))
      .getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    this.collider = this.template.createComponent("Physics.ColliderComponent") as ColliderComponent
    this.interactable = this.template.createComponent(Interactable.getTypeName()) as Interactable
    this.interactable.onTriggerStart.add((e) => this.onGrab(e))
    this.interactable.onTriggerUpdate.add((e) => this.onDrag(e))

    const r = this.markerDiameter / 2
    const markerMesh = new FlatMesh(0.35).disc({x: 0, z: 0}, r * 0.45).ring({x: 0, z: 0}, r, 0.35).build()
    this.marker = meshObject(this.content, "CornerMarker", markerMesh, tintedMaterial(this.lineMaterial, new vec4(1, 0.95, 0.55, 1)))
    this.tick = this.audio(this.marker, this.tickAudio)

    const arrowMesh = new FlatMesh(0.3)
      .triangle({x: 3, z: 0}, {x: 0, z: -1.6}, {x: 0, z: 1.6})
      .rect(-3, -0.4, 0, 0.4)
      .build()
    this.arrow = meshObject(this.content, "OffViewArrow", arrowMesh, tintedMaterial(this.lineMaterial, this.outlineColor))

    this.summary = this.flatText("Summary", this.summarySize)
    this.chime = this.audio(this.summary.getSceneObject(), this.chimeAudio)

    this.createEvent("UpdateEvent").bind(() => {
      if (!this.marker.enabled) return
      const s = 1 + 0.25 * Math.sin(getTime() * 6)
      this.marker.getTransform().setLocalScale(new vec3(s, 1, s))
    })
  }

  render(v: StoneView): void {
    this.content.enabled = v.visible && v.sink !== null
    if (!this.content.enabled) return
    const sink = v.sink as Sink
    if (sink !== this.builtSink) this.buildTemplate(sink)

    this.template.getTransform().setLocalPosition(new vec3(v.x, 0, v.z))
    this.interactable.enabled = v.dragEnabled
    this.collider.enabled = v.dragEnabled

    const hw = sink.w / 2
    const hh = sink.h / 2
    const front = v.z + hh
    const back = v.z - hh
    const left = v.x - hw
    const right = v.x + hw
    const E = SLAB_W / 2
    const D = SLAB_D / 2
    this.placeRect(this.fills.Front, left, front, right, D, 0.05, v.amber.front)
    this.placeRect(this.fills.Back, left, -D, right, back, 0.05, v.amber.back)
    this.placeRect(this.fills.Left, -E, back, left, front, 0.05, v.amber.left)
    this.placeRect(this.fills.Right, right, back, E, front, 0.05, v.amber.right)
    const t = 0.3 // dimension line thickness
    this.placeRect(this.dims.Front, v.x - t / 2, front, v.x + t / 2, D, 0.1, true)
    this.placeRect(this.dims.Back, v.x - t / 2, -D, v.x + t / 2, back, 0.1, true)
    this.placeRect(this.dims.Left, -E, v.z - t / 2, left, v.z + t / 2, 0.1, true)
    this.placeRect(this.dims.Right, right, v.z - t / 2, E, v.z + t / 2, 0.1, true)

    const size = v.tracing ? this.labelSize / 2 : this.labelSize
    const off = size / 22 // keeps labels clear of the dimension line at any size
    this.setLabel("Front", v.x + off, (front + D) / 2, `${fmt(v.rails.front)} cm`, v.amber.front, false, size)
    this.setLabel("Back", v.x + off, (back - D) / 2, `${fmt(v.rails.back)} cm`, v.amber.back, false, size)
    const lr = (n: number) => (v.centered ? `${fmt(n)} cm centered` : `${fmt(n)} cm`)
    this.setLabel("Left", (left - E) / 2, v.z - size / 50, lr(v.rails.left), v.amber.left, v.centered, size)
    this.setLabel("Right", (right + E) / 2, v.z - size / 50, lr(v.rails.right), v.amber.right, v.centered, size)

    this.marker.enabled = v.marker !== null
    if (v.marker) this.marker.getTransform().setLocalPosition(new vec3(v.marker.x, 0, v.marker.z))

    this.arrow.enabled = v.arrow !== null
    if (v.arrow) {
      const tr = this.arrow.getTransform()
      tr.setLocalPosition(new vec3(v.arrow.x, 0, v.arrow.z))
      tr.setLocalRotation(quat.angleAxis(Math.atan2(-v.arrow.dirZ, v.arrow.dirX), vec3.up()))
    }

    const so = this.summary.getSceneObject()
    so.enabled = v.summary.length > 0
    this.summary.text = v.summary
    so.getTransform().setLocalPosition(new vec3(v.x, 0.25, v.z + 5)) // in front of the centre cross
  }

  playTick(): void {
    if (this.tick.audioTrack) this.tick.play(1)
  }

  playChime(): void {
    if (this.chime.audioTrack) this.chime.play(1)
  }

  /** Slab-local point → world, for visibility checks. */
  toWorld(p: Point2): vec3 {
    return this.getTransform().getWorldTransform().multiplyPoint(new vec3(p.x, 0, p.z))
  }

  private buildTemplate(sink: Sink): void {
    const w = this.lineWidth
    const fz = -faucetOffset(sink)
    const m = new FlatMesh(0.2)
      .loop(outlinePoints(sink), w)
      .segment({x: -2, z: 0}, {x: 2, z: 0}, 0.4)
      .segment({x: 0, z: -2}, {x: 0, z: 2}, 0.4)
      .ring({x: 0, z: fz}, FAUCET_DIAMETER / 2, 0.35)
    this.outline.mesh = m.build()
    // Grab box centred on the cutout, deep enough to also cover the faucet hole behind it.
    const shape = Shape.createBoxShape()
    shape.size = new vec3(sink.w + 2, 2, 2 * (-fz + FAUCET_DIAMETER / 2 + 1))
    this.collider.shape = shape
    this.builtSink = sink
  }

  private placeRect(so: SceneObject, x0: number, z0: number, x1: number, z1: number, y: number, show: boolean): void {
    const w = x1 - x0
    const d = z1 - z0
    so.enabled = show && w > 0.05 && d > 0.05
    if (!so.enabled) return
    const tr = so.getTransform()
    tr.setLocalPosition(new vec3((x0 + x1) / 2, y, (z0 + z1) / 2))
    tr.setLocalScale(new vec3(w, 1, d))
  }

  private setLabel(side: Side, x: number, z: number, text: string, amber: boolean, centered: boolean, size: number): void {
    const t = this.labels[side]
    t.text = text
    t.size = size
    t.textFill.color = amber ? this.amberColor : centered ? this.centeredColor : this.white
    t.getSceneObject().getTransform().setLocalPosition(new vec3(x, 0.3, z))
  }

  private flatText(name: string, size: number): Text {
    const so = global.scene.createSceneObject(name)
    so.setParent(this.content)
    so.getTransform().setLocalRotation(FLAT)
    const t = so.createComponent("Component.Text") as Text
    t.size = size
    t.depthTest = true
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.textFill.color = this.white
    // Dark outline only helps the preview over the virtual stand-in; on the additive display it is invisible.
    t.outlineSettings.enabled = true
    t.outlineSettings.size = 0.05
    t.outlineSettings.fill.color = new vec4(0.05, 0.05, 0.08, 1)
    return t
  }

  private audio(so: SceneObject, track: AudioTrackAsset): AudioComponent {
    const a = so.createComponent("Component.AudioComponent") as AudioComponent
    a.playbackMode = Audio.PlaybackMode.LowLatency
    if (track) a.audioTrack = track
    return a
  }

  private hitOnStone(e: InteractorEvent): vec3 | null {
    const o = e.interactor.startPoint
    const d = e.interactor.direction
    if (!o || !d || Math.abs(d.y) < 1e-4) return null
    const planeY = this.getTransform().getWorldPosition().y
    const k = (planeY - o.y) / d.y
    if (k <= 0) return null
    return o.add(d.uniformScale(k))
  }

  private onGrab(e: InteractorEvent): void {
    const hit = this.hitOnStone(e)
    this.grabOffset = hit ? this.template.getTransform().getWorldPosition().sub(hit) : vec3.zero()
  }

  private onDrag(e: InteractorEvent): void {
    const hit = this.hitOnStone(e)
    if (!hit) return
    const local = this.getTransform().getInvertedWorldTransform().multiplyPoint(hit.add(this.grabOffset))
    this._onDragTo.invoke({x: local.x, z: local.z})
  }
}
