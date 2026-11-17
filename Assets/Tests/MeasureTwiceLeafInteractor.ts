// Shared LEAF helpers for Measure Twice: real SIK input on the UIKit buttons, cards, Template and slider.
// The controller is read for assertions; only newLayout() is called directly (known-state reset).
import {DefaultLeafInteractor} from "Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {DEFAULT_EVENT_TIMEOUT_MS, findSceneObjectByName, sleep} from "Leaf.lspkg/Utils/common/Utils"
import {MeasureTwiceController} from "../Scripts/MeasureTwiceController"

export class MeasureTwiceLeafInteractor extends DefaultLeafInteractor {
  constructor() {
    super("MeasureTwiceLeafInteractor")
    this.eventTimeoutMs = DEFAULT_EVENT_TIMEOUT_MS // fail with a named timeout instead of hanging
  }

  get ctrl(): MeasureTwiceController {
    const so = findSceneObjectByName("MeasureTwice")
    return so.getComponent(MeasureTwiceController.getTypeName()) as MeasureTwiceController
  }

  text(name: string): Text {
    return findSceneObjectByName(name).getComponent("Component.Text") as Text
  }

  enabled(name: string): boolean {
    const so = findSceneObjectByName(name)
    return !isNull(so) && so.isEnabledInHierarchy
  }

  /** Real pinch (trigger) on an enabled UIKit button / card. */
  async tap(name: string): Promise<void> {
    const target = findInteractablesByName(name, undefined, true)[0]
    if (!target) throw new Error(`Interactable "${name}" not found or not enabled`)
    await this.trigger(target)
    await sleep(300)
  }

  /** Real drag on an enabled interactable; vector is world cm added to the ray per drag update. */
  async dragByName(name: string, perUpdate: vec3, ms: number): Promise<void> {
    const target = findInteractablesByName(name, undefined, true)[0]
    if (!target) throw new Error(`Interactable "${name}" not found or not enabled`)
    await this.drag(target, perUpdate, ms)
    await sleep(300)
  }

  /** Known state: newLayout() (controller reset), then real pinches on "Slab is here" and the card. */
  async toPositioning(sinkIndex: number): Promise<void> {
    await sleep(800)
    this.ctrl.newLayout()
    await sleep(300)
    await this.tap("SlabHereButton")
    await this.tap(`SinkCard_${sinkIndex}`)
    if (this.ctrl.state !== "positioning") throw new Error(`expected positioning, got ${this.ctrl.state}`)
  }
}

export function near(a: number, b: number, tol = 0.02): boolean {
  return Math.abs(a - b) <= tol
}
