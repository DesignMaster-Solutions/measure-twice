// MeasureTwiceSinkCardsUI — passive view: the three sink cards standing along the back edge of the slab.
// Owns: SinkCard_0..2 (UIKit Button faces), each with the sink name, its cutout outline drawn to a
//       common scale (so the large rectangle reads bigger than the oval) and the size in cm and inches.
// Emits onSelect(index). Holds no domain state; setVisible() only shows/hides.
// Card content is three fixed rows (name / drawing / size) on a fixed-size card, so rows are placed
// at fixed offsets from the card centre.

import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {outlinePoints, SINKS} from "./MeasureTwiceLayout"
import {FlatMesh, meshObject, tintedMaterial} from "./MeasureTwiceMesh"

@component
export class MeasureTwiceSinkCardsUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">MeasureTwiceSinkCardsUI – sink picker cards</span>')
  @ui.separator
  @ui.group_start("References")
  @input
  @hint("Unlit material cloned for the outline drawings")
  lineMaterial: Material
  @ui.group_end

  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Card width (cm)")
  @widget(new SliderWidget(15, 30, 0.5))
  cardWidth: number = 22

  @input
  @hint("Card height (cm)")
  @widget(new SliderWidget(15, 30, 0.5))
  cardHeight: number = 24

  @input
  @hint("Gap between cards (cm)")
  @widget(new SliderWidget(0, 10, 0.5))
  cardGap: number = 3

  @input
  @hint("Tilt of the cards back toward the user (degrees)")
  @widget(new SliderWidget(0, 60, 1))
  tiltDegrees: number = 25

  @input("vec4", "{0.2, 0.9, 1.0, 1}")
  @hint("Outline drawing colour")
  @widget(new ColorWidget())
  drawingColor: vec4 = new vec4(0.2, 0.9, 1.0, 1)
  @ui.group_end

  private _onSelect = new Event<number>()
  get onSelect(): PublicApi<number> {
    return this._onSelect.publicApi()
  }

  private cards: SceneObject[] = []

  onAwake(): void {
    const mat = tintedMaterial(this.lineMaterial, this.drawingColor)
    const largest = Math.max(...SINKS.map((s) => s.w))
    const drawScale = (this.cardWidth - 7) / largest // common scale: relative sizes stay true
    const tilt = quat.fromEulerAngles((-this.tiltDegrees * Math.PI) / 180, 0, 0)
    SINKS.forEach((sink, i) => {
      const so = global.scene.createSceneObject(`SinkCard_${i}`)
      so.setParent(this.sceneObject)
      const x = (i - (SINKS.length - 1) / 2) * (this.cardWidth + this.cardGap)
      so.getTransform().setLocalPosition(new vec3(x, this.cardHeight / 2 + 1, 0))
      so.getTransform().setLocalRotation(tilt)
      const btn = so.createComponent(Button.getTypeName()) as Button
      btn.size = new vec3(this.cardWidth, this.cardHeight, 1) // before init (OnStart)
      btn.onTriggerUp.add(() => this._onSelect.invoke(i))

      const h = this.cardHeight
      this.addText(so, "Name", sink.name, new vec3(0, h / 2 - 3.2, 0.6), 64)
      // Drawing is built in XZ; rotate +90° about X so it stands in the card plane (sink front = card bottom).
      const mesh = new FlatMesh().loop(outlinePoints(sink), 0.35, {x: 0, z: 0}, drawScale).build()
      const drawing = meshObject(so, "Drawing", mesh, mat)
      drawing.getTransform().setLocalPosition(new vec3(0, 0.3, 0.6))
      drawing.getTransform().setLocalRotation(quat.fromEulerAngles(Math.PI / 2, 0, 0))
      this.addText(so, "Size", `${sink.w} x ${sink.h} cm\n${sink.inches}`, new vec3(0, -h / 2 + 3.6, 0.6), 46)
      this.cards.push(so)
    })
  }

  setVisible(on: boolean): void {
    for (const c of this.cards) c.enabled = on
  }

  private addText(parent: SceneObject, name: string, text: string, pos: vec3, size: number): Text {
    const so = global.scene.createSceneObject(name)
    so.setParent(parent)
    so.getTransform().setLocalPosition(pos)
    const t = so.createComponent("Component.Text") as Text
    t.text = text
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
