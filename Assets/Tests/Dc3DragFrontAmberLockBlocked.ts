import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {MeasureTwiceLeafInteractor, near} from "./MeasureTwiceLeafInteractor"

// DC3: dragging the outline toward the front lowers the front number; below the shop minimum it turns amber and Lock stops working.
@component
export class Dc3DragFrontAmberLockBlocked extends Scenario {
  async run(): Promise<void> {
    const it = new MeasureTwiceLeafInteractor()
    await it.toPositioning(2)
    const c = it.ctrl
    const front0 = c.frontRail
    expect(c.frontAmber).toBe(false)

    // Real SIK drag on Template toward the user (+z), repeated until below the shop minimum.
    for (let i = 0; i < 6 && !c.frontAmber; i++) {
      const before = c.frontRail
      await it.dragByName("Template", new vec3(0, 0, 0.25), 700)
      expect(c.frontRail).toBeLessThan(before)
    }
    print(`dc3: front ${front0} -> ${c.frontRail}, shopMin ${c.shopMin}`)
    expect(c.frontRail).toBeLessThan(front0)
    expect(c.frontAmber).toBe(true)
    const col = it.text("RailLabel_Front").textFill.color
    expect(near(col.x, 1) && near(col.y, 0.68) && near(col.z, 0.12)).toBe(true)
    expect(c.canLock).toBe(false)

    // Pinch Lock: it is inactive (interactable disabled), so the pinch must not lock.
    const lock = findInteractablesByName("LockButton")[0]
    expect(lock.enabled).toBe(false)
    it.eventTimeoutMs = 2000
    let pinchError = ""
    try {
      await it.trigger(lock)
    } catch (e) {
      pinchError = `${e}`
    }
    await sleep(300)
    print(`dc3: pinch on inactive Lock -> ${pinchError || "no error"}`)
    expect(c.isLocked).toBe(false)
    expect(c.state).toBe("positioning")
  }
}
