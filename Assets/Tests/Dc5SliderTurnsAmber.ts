import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {MeasureTwiceLeafInteractor, near} from "./MeasureTwiceLeafInteractor"

// DC5: moving the shop-minimum slider up turns a white rail amber without moving the outline.
@component
export class Dc5SliderTurnsAmber extends Scenario {
  async run(): Promise<void> {
    const it = new MeasureTwiceLeafInteractor()
    await it.toPositioning(2) // Large: front = back = 9 cm, white at the default 7.5 cm
    const c = it.ctrl
    expect(c.frontAmber).toBe(false)
    const white = it.text("RailLabel_Front").textFill.color
    expect(near(white.x, 1) && near(white.y, 1) && near(white.z, 1)).toBe(true)
    const x0 = c.templateX
    const z0 = c.templateZ
    const min0 = c.shopMin

    await it.dragByName("ShopMinSlider", new vec3(1, 0, 0), 800) // real drag along the slider (+x)
    print(`dc5: shopMin ${min0} -> ${c.shopMin}, front ${c.frontRail}`)
    expect(c.shopMin).toBeGreaterThan(min0)
    expect(c.shopMin).toBeGreaterThan(c.frontRail)
    expect(c.frontAmber).toBe(true)
    const col = it.text("RailLabel_Front").textFill.color
    expect(near(col.x, 1) && near(col.y, 0.68) && near(col.z, 0.12)).toBe(true)
    expect(c.templateX).toBe(x0)
    expect(c.templateZ).toBe(z0)
    expect(it.text("ShopMinLabel").text.includes(`${c.shopMin.toFixed(1)} cm`)).toBe(true)
  }
}
