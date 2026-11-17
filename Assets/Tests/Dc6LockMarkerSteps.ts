import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findInteractablesByName} from "Leaf.lspkg/Interactors/InteractableUtils"
import {findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {markPoints, SINKS} from "../Scripts/MeasureTwiceLayout"
import {MeasureTwiceLeafInteractor} from "./MeasureTwiceLeafInteractor"

// DC6: Lock stops dragging and shows the marker on the first corner; each Marked moves it on, then to the faucet hole.
@component
export class Dc6LockMarkerSteps extends Scenario {
  async run(): Promise<void> {
    const it = new MeasureTwiceLeafInteractor()
    await it.toPositioning(2)
    const c = it.ctrl
    expect(c.canLock).toBe(true)
    await it.tap("LockButton") // real pinch
    expect(c.isLocked).toBe(true)
    expect(c.state).toBe("tracing")
    expect(c.markIndex).toBe(0)

    // Real drag attempt on the locked Template: its interactable is disabled, so nothing may move.
    const x0 = c.templateX
    const z0 = c.templateZ
    const tpl = findInteractablesByName("Template")[0]
    expect(tpl.enabled).toBe(false)
    it.eventTimeoutMs = 2000
    try {
      await it.drag(tpl, new vec3(0, 0, 0.3), 500)
    } catch (e) {
      print(`dc6: drag on locked Template -> ${e}`)
    }
    it.eventTimeoutMs = 10000
    expect(c.templateX).toBe(x0)
    expect(c.templateZ).toBe(z0)

    const marker = findSceneObjectByName("CornerMarker")
    const pts = markPoints(SINKS[2])
    for (let i = 0; i < 5; i++) {
      expect(c.markIndex).toBe(i)
      expect(marker.isEnabledInHierarchy).toBe(true)
      const p = marker.getTransform().getLocalPosition()
      expect(p.x).toBeCloseTo(x0 + pts[i].x, 2)
      expect(p.z).toBeCloseTo(z0 + pts[i].z, 2)
      if (i === 4) break // 5th target is the faucet hole: pts[4] = (0, -faucetOffset)
      await it.tap("MarkedButton") // real pinch
    }
    expect(pts[4].x).toBe(0)
    expect(c.markIndex).toBe(4)
    expect(c.state).toBe("tracing")
  }
}
