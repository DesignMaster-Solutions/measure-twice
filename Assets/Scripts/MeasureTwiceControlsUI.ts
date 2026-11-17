// MeasureTwiceControlsUI — passive view: the controls along the front edge of the work stand.
// Owns: SlabHereButton (centre), ShopMinSlider + label (left), ChangeSinkButton, CenterButton, LockButton
//       (right; LockButton reads "Unlock" while tracing), MarkedButton (replaces Center while tracing),
//       NewLayoutButton (shown with the summary). All UIKit Button / Slider.
// Emits intent events; holds no domain state. setMode() decides only which controls are visible.
// Layout: the brief fixes three zones on the stand edge (slider left, slab button centre, buttons right),
// so zone anchors are explicit x positions; buttons inside the right zone are spaced by rowLayout().

import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {Slider} from "SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider"
import {fmt} from "./MeasureTwiceLayout"

export type Mode = "findSlab" | "pickSink" | "positioning" | "tracing" | "done"

const LABEL_Z = 0.6 // in front of the button face

@component
export class MeasureTwiceControlsUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">MeasureTwiceControlsUI – buttons and slider on the stand edge</span>')
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Width of Center / Lock / Marked buttons (cm)")
  @widget(new SliderWidget(8, 20, 0.5))
  buttonWidth: number = 12

  @input
  @hint("Height of the stand-edge buttons (cm)")
  @widget(new SliderWidget(4, 10, 0.5))
  buttonHeight: number = 6

  @input
  @hint("Width of the 'Slab is here' button (cm)")
  @widget(new SliderWidget(15, 40, 1))
  slabButtonWidth: number = 30

  @input
  @hint("Shop minimum slider width (cm)")
  @widget(new SliderWidget(15, 40, 1))
  sliderWidth: number = 25

  @input
  @hint("Shop minimum range, low end (cm)")
  shopMinLow: number = 5

  @input
  @hint("Shop minimum range, high end (cm)")
  shopMinHigh: number = 10

  @input
  @hint("Button label text size")
  @widget(new SliderWidget(30, 100, 1))
  labelSize: number = 60
  @ui.group_end

  private _onSlabHere = new Event<void>()
  private _onCenter = new Event<void>()
  private _onLockToggle = new Event<void>()
  private _onChangeSink = new Event<void>()
  private _onMarked = new Event<void>()
  private _onNewLayout = new Event<void>()
  private _onShopMin = new Event<number>()
  get onSlabHere(): PublicApi<void> { return this._onSlabHere.publicApi() }
  get onCenter(): PublicApi<void> { return this._onCenter.publicApi() }
  get onLockToggle(): PublicApi<void> { return this._onLockToggle.publicApi() }
  get onChangeSink(): PublicApi<void> { return this._onChangeSink.publicApi() }
  get onMarked(): PublicApi<void> { return this._onMarked.publicApi() }
  get onNewLayout(): PublicApi<void> { return this._onNewLayout.publicApi() }
  get onShopMin(): PublicApi<number> { return this._onShopMin.publicApi() }

  private slabHere: Button
  private center: Button
  private lock: Button
  private lockLabel: Text
  private changeSink: Button
  private marked: Button
  private newLayout: Button
  private slider: Slider
  private sliderRoot: SceneObject
  private sliderLabel: Text
  private lastLabel: Text
  private lockLabelColor = new vec4(1, 1, 1, 1)

  onAwake(): void {
    const w = this.buttonWidth
    const h = this.buttonHeight
    this.slabHere = this.addButton("SlabHereButton", "Slab is here", this.slabButtonWidth, h + 1, 0, () => this._onSlabHere.invoke())

    // Right zone: Change sink | Center | Lock, spaced by rowLayout from x = 12.
    const right = this.rowLayout(12, [w + 4, w, w], 2)
    this.changeSink = this.addButton("ChangeSinkButton", "Change sink", w + 4, h, right[0], () => this._onChangeSink.invoke())
    this.center = this.addButton("CenterButton", "Center", w, h, right[1], () => this._onCenter.invoke())
    this.lock = this.addButton("LockButton", "Lock", w, h, right[2], () => this._onLockToggle.invoke())
    this.lockLabel = this.lastLabel
    this.marked = this.addButton("MarkedButton", "Marked", w, h, right[1], () => this._onMarked.invoke())
    this.newLayout = this.addButton("NewLayoutButton", "New layout", w + 4, h, right[1], () => this._onNewLayout.invoke())

    // Left zone: shop minimum slider with its label above it.
    const sx = -61 + this.sliderWidth / 2 + 4
    this.sliderRoot = global.scene.createSceneObject("ShopMinGroup")
    this.sliderRoot.setParent(this.sceneObject)
    this.sliderRoot.getTransform().setLocalPosition(new vec3(sx, 0, 0))
    const so = global.scene.createSceneObject("ShopMinSlider")
    so.setParent(this.sliderRoot)
    so.getTransform().setLocalPosition(new vec3(0, -1.2, 0))
    this.slider = so.createComponent(Slider.getTypeName()) as Slider
    this.slider.size = new vec3(this.sliderWidth, 3, 1) // before init (OnStart)
    this.slider.onValueChange.add((v: number) => this._onShopMin.invoke(this.toShopMin(v)))
    this.sliderLabel = this.addText(this.sliderRoot, "ShopMinLabel", new vec3(0, 3.4, 0.3), this.labelSize)
  }

  /** Which controls show for each mode; Lock is inactive (dimmed, ignores pinch) when !canLock. */
  setMode(mode: Mode, canLock: boolean): void {
    const positioning = mode === "positioning"
    const tracing = mode === "tracing"
    this.slabHere.getSceneObject().enabled = mode === "findSlab"
    this.sliderRoot.enabled = positioning
    this.center.getSceneObject().enabled = positioning
    this.changeSink.getSceneObject().enabled = positioning
    this.lock.getSceneObject().enabled = positioning || tracing
    this.marked.getSceneObject().enabled = tracing
    this.newLayout.getSceneObject().enabled = mode === "done"
    this.lockLabel.text = tracing ? "Unlock" : "Lock"
    const lockActive = tracing || canLock
    this.lock.inactive = !lockActive
    this.lockLabel.textFill.color = lockActive ? this.lockLabelColor : new vec4(1, 1, 1, 0.35)
  }

  setShopMin(v: number): void {
    this.sliderLabel.text = `Shop minimum ${fmt(v)} cm`
    const t = (v - this.shopMinLow) / (this.shopMinHigh - this.shopMinLow)
    if (Math.abs(this.slider.currentValue - t) > 1e-4) this.slider.currentValue = t
  }

  private toShopMin(t: number): number {
    return Math.round((this.shopMinLow + t * (this.shopMinHigh - this.shopMinLow)) * 10) / 10
  }

  /** Centres for widths laid out left-to-right from x0 with a gap (a one-row flex). */
  private rowLayout(x0: number, widths: number[], gap: number): number[] {
    const out: number[] = []
    let x = x0
    for (const w of widths) {
      out.push(x + w / 2)
      x += w + gap
    }
    return out
  }

  private addButton(name: string, label: string, w: number, h: number, x: number, onClick: () => void): Button {
    const so = global.scene.createSceneObject(name)
    so.setParent(this.sceneObject)
    so.getTransform().setLocalPosition(new vec3(x, 0, 0))
    const btn = so.createComponent(Button.getTypeName()) as Button
    btn.size = new vec3(w, h, 1) // before init (OnStart)
    const t = this.addText(so, "Label", new vec3(0, 0, LABEL_Z), this.labelSize)
    t.text = label
    this.lastLabel = t
    btn.onTriggerUp.add(() => onClick())
    return btn
  }

  private addText(parent: SceneObject, name: string, pos: vec3, size: number): Text {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    so.getTransform().setLocalPosition(pos)
    const t = so.createComponent("Component.Text") as Text
    t.size = size
    t.depthTest = true
    t.horizontalAlignment = HorizontalAlignment.Center
    t.verticalAlignment = VerticalAlignment.Center
    t.horizontalOverflow = HorizontalOverflow.Overflow
    t.verticalOverflow = VerticalOverflow.Overflow
    t.textFill.color = new vec4(1, 1, 1, 1)
    return t
  }
}
