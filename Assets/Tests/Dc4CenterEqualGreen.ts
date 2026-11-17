import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {MeasureTwiceLeafInteractor, near} from "./MeasureTwiceLeafInteractor"

// DC4: pinching Center makes left and right equal and green.
@component
export class Dc4CenterEqualGreen extends Scenario {
  async run(): Promise<void> {
    const it = new MeasureTwiceLeafInteractor()
    await it.toPositioning(1)
    const c = it.ctrl
    await it.dragByName("Template", new vec3(0.3, 0, 0), 600) // real drag off-centre (+x)
    print(`dc4: after drag left=${c.leftRail} right=${c.rightRail}`)
    expect(c.isCentered).toBe(false)
    expect(it.text("RailLabel_Left").text.includes("centered")).toBe(false)
    const z0 = c.templateZ

    await it.tap("CenterButton") // real pinch
    print(`dc4: after Center left=${c.leftRail} right=${c.rightRail}`)
    expect(Math.abs(c.leftRail - c.rightRail) <= 0.2).toBe(true)
    expect(c.isCentered).toBe(true)
    expect(c.templateZ).toBeCloseTo(z0, 3)
    for (const s of ["Left", "Right"]) {
      const t = it.text(`RailLabel_${s}`)
      expect(t.text.includes("centered")).toBe(true)
      const col = t.textFill.color
      expect(near(col.x, 0.45) && near(col.y, 1) && near(col.z, 0.55)).toBe(true)
    }
  }
}
