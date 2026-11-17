// MeasureTwiceController — the single owner of Measure Twice state; everything else is a passive view.
// Owns: state machine (findSlab → pickSink → positioning → tracing → done), template position, rails,
//       shop minimum, lock, mark index, summary, and the off-view arrow + tick decision.
// Inputs: controls / cards / stone UI modules (typed), the scene Camera (for the off-view check).
// Must not: build UI or text. It pushes state to the views and reacts to their intent events.
// Public API (for LEAF): state, sinkIndex, templateX/Z, frontRail/backRail/leftRail/rightRail, shopMin,
//   isLocked, isCentered, canLock, markIndex, summaryText, slabHere(), selectSink(i), changeSink(),
//   moveTemplateTo(x,z), center(), setShopMin(v), lock(), unlock(), marked(), newLayout().

import {MeasureTwiceControlsUI, Mode} from "./MeasureTwiceControlsUI"
import {MeasureTwiceSinkCardsUI} from "./MeasureTwiceSinkCardsUI"
import {MeasureTwiceStoneUI} from "./MeasureTwiceStoneUI"
import {
  clampPosition,
  isCentered,
  layoutSelfCheck,
  markPoints,
  Point2,
  Rails,
  railsFor,
  Sink,
  SINKS,
  startPosition,
  summaryFor
} from "./MeasureTwiceLayout"

@component
export class MeasureTwiceController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">MeasureTwiceController – state and logic</span>')
  @ui.separator
  @ui.group_start("References")
  @input
  @hint("Stand-edge buttons and shop minimum slider")
  controls: MeasureTwiceControlsUI

  @input
  @hint("Sink picker cards on the back edge")
  cards: MeasureTwiceSinkCardsUI

  @input
  @hint("Outline, rails and marks drawn on the stone")
  stone: MeasureTwiceStoneUI

  @input
  @hint("Scene camera, used to tell when the next corner is out of view")
  camera: Camera
  @ui.group_end

  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Starting shop minimum for front/back rails (cm); a sample shop rule")
  @widget(new SliderWidget(5, 10, 0.1))
  shopMinDefault: number = 7.5

  @input
  @hint("Left and right count as centred within this difference (cm)")
  @widget(new SliderWidget(0.05, 1, 0.05))
  centerTolerance: number = 0.2

  @input
  @hint("Print state changes to the log")
  debugLog: boolean = false
  @ui.group_end

  // ---- public state (read by LEAF) ----
  state: Mode = "findSlab"
  sinkIndex = -1
  templateX = 0
  templateZ = 0
  frontRail = 0
  backRail = 0
  leftRail = 0
  rightRail = 0
  shopMin = 7.5
  isLocked = false
  markIndex = 0 // marks done so far, 0..5
  summaryText = ""
  /** Rails captured at lock time; the summary reports these. */
  lockedRails: Rails | null = null
  lockedCentered = false

  private nextOffView = false
  private started = false

  get sink(): Sink | null {
    return this.sinkIndex >= 0 ? SINKS[this.sinkIndex] : null
  }
  get rails(): Rails {
    return {front: this.frontRail, back: this.backRail, left: this.leftRail, right: this.rightRail}
  }
  get isCentered(): boolean {
    return this.sink !== null && isCentered(this.rails, this.centerTolerance)
  }
  get frontAmber(): boolean { return this.frontRail < this.shopMin - 1e-6 }
  get backAmber(): boolean { return this.backRail < this.shopMin - 1e-6 }
  get leftAmber(): boolean { return this.leftRail < this.shopMin - 1e-6 }
  get rightAmber(): boolean { return this.rightRail < this.shopMin - 1e-6 }
  get canLock(): boolean {
    return this.state === "positioning" && !this.frontAmber && !this.backAmber
  }
  get markCount(): number {
    return this.sink ? markPoints(this.sink).length : 0
  }
  /** Next point to mark in slab-local cm, or null. */
  get nextMark(): Point2 | null {
    if (this.state !== "tracing" || !this.sink) return null
    const p = markPoints(this.sink)[this.markIndex]
    return {x: this.templateX + p.x, z: this.templateZ + p.z}
  }

  onAwake(): void {
    this.shopMin = this.shopMinDefault
    const fails = layoutSelfCheck()
    if (fails.length) print("MeasureTwice layout self-check FAILED: " + fails.join("; "))
    // The views sit lower in the hierarchy and wake after this script, so wire them on start.
    this.createEvent("OnStartEvent").bind(() => this.wireViews())
    // First refresh after every OnStart, so UIKit elements initialise before any are hidden.
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private wireViews(): void {
    this.controls.onSlabHere.add(() => this.slabHere())
    this.controls.onCenter.add(() => this.center())
    this.controls.onLockToggle.add(() => (this.isLocked ? this.unlock() : this.lock()))
    this.controls.onChangeSink.add(() => this.changeSink())
    this.controls.onMarked.add(() => this.marked())
    this.controls.onNewLayout.add(() => this.newLayout())
    this.controls.onShopMin.add((v) => this.setShopMin(v))
    this.cards.onSelect.add((i) => this.selectSink(i))
    this.stone.onDragTo.add((p) => this.moveTemplateTo(p.x, p.z))
  }

  // ---- actions ----
  slabHere(): boolean {
    if (this.state !== "findSlab") return false
    return this.go("pickSink")
  }

  selectSink(i: number): boolean {
    if (this.state !== "pickSink" || i < 0 || i >= SINKS.length) return false
    this.sinkIndex = i
    const p = startPosition(SINKS[i])
    this.place(p.x, p.z)
    return this.go("positioning")
  }

  changeSink(): boolean {
    if (this.state !== "positioning") return false
    this.sinkIndex = -1
    return this.go("pickSink")
  }

  moveTemplateTo(x: number, z: number): boolean {
    if (this.state !== "positioning" || this.isLocked || !this.sink) return false
    this.place(x, z)
    this.refresh()
    return true
  }

  center(): boolean {
    if (this.state !== "positioning" || this.isLocked) return false
    this.place(0, this.templateZ)
    this.refresh()
    return true
  }

  setShopMin(v: number): void {
    const c = Math.min(10, Math.max(5, Math.round(v * 10) / 10))
    if (c === this.shopMin) return
    this.shopMin = c
    this.refresh()
  }

  lock(): boolean {
    if (!this.canLock) return false
    this.isLocked = true
    this.lockedRails = this.rails
    this.lockedCentered = this.isCentered
    this.markIndex = 0
    return this.go("tracing")
  }

  unlock(): boolean {
    if (this.state !== "tracing") return false
    this.isLocked = false
    this.lockedRails = null
    this.markIndex = 0
    return this.go("positioning")
  }

  marked(): boolean {
    if (this.state !== "tracing") return false
    this.markIndex++
    this.nextOffView = false
    if (this.markIndex >= this.markCount) {
      this.summaryText = summaryFor(this.lockedRails as Rails, this.lockedCentered, this.markIndex)
      this.go("done")
      this.stone.playChime()
      return true
    }
    this.refresh()
    return true
  }

  newLayout(): boolean {
    this.sinkIndex = -1
    this.isLocked = false
    this.lockedRails = null
    this.markIndex = 0
    this.summaryText = ""
    this.shopMin = this.shopMinDefault
    return this.go("findSlab")
  }

  // ---- internals ----
  private place(x: number, z: number): void {
    const s = this.sink as Sink
    const p = clampPosition(s, x, z)
    this.templateX = p.x
    this.templateZ = p.z
    const r = railsFor(s, p.x, p.z)
    this.frontRail = r.front
    this.backRail = r.back
    this.leftRail = r.left
    this.rightRail = r.right
  }

  private go(next: Mode): boolean {
    this.state = next
    if (this.debugLog) print(`MeasureTwice state → ${next}`)
    this.refresh()
    return true
  }

  private onUpdate(): void {
    if (!this.started) {
      this.started = true
      this.refresh()
      return
    }
    if (this.state !== "tracing") return
    const off = this.isNextOffView()
    if (off && !this.nextOffView) this.stone.playTick()
    if (off !== this.nextOffView) {
      this.nextOffView = off
      this.refresh()
    }
  }


  private isNextOffView(): boolean {
    const p = this.nextMark
    if (!p || !this.camera) return false
    return !this.camera.isSphereVisible(this.stone.toWorld(p), 1.5)
  }

  /** Push the whole state to the views. */
  refresh(): void {
    if (!this.started) return
    const tracing = this.state === "tracing"
    this.controls.setMode(this.state, this.canLock)
    this.controls.setShopMin(this.shopMin)
    this.cards.setVisible(this.state === "pickSink")
    const next = this.nextMark
    let arrow = null
    if (tracing && next && this.nextOffView) {
      const dx = next.x - this.templateX
      const dz = next.z - this.templateZ
      const len = Math.max(1e-3, Math.sqrt(dx * dx + dz * dz))
      arrow = {x: this.templateX + dx * 0.55, z: this.templateZ + dz * 0.55, dirX: dx / len, dirZ: dz / len}
    }
    this.stone.render({
      visible: this.state === "positioning" || tracing || this.state === "done",
      sink: this.sink,
      x: this.templateX,
      z: this.templateZ,
      rails: this.rails,
      amber: {front: this.frontAmber, back: this.backAmber, left: this.leftAmber, right: this.rightAmber},
      centered: this.isCentered,
      tracing: tracing || this.state === "done",
      marker: next,
      arrow,
      summary: this.state === "done" ? this.summaryText : "",
      dragEnabled: this.state === "positioning" && !this.isLocked
    })
  }
}
