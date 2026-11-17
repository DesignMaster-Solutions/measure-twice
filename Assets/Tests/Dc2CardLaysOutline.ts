import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {findSceneObjectByName} from "Leaf.lspkg/Utils/common/Utils"
import {MeasureTwiceLeafInteractor} from "./MeasureTwiceLeafInteractor"

// DC2: pinching a card lays the outline on the slab with four cm distances; 53x38 outline is larger than 43x36.
@component
export class Dc2CardLaysOutline extends Scenario {
  private outlineWidth(): number {
    const rmv = findSceneObjectByName("Template").getChild(0).getComponent("Component.RenderMeshVisual") as RenderMeshVisual
    return rmv.worldAabbMax().x - rmv.worldAabbMin().x
  }

  private checkLabels(it: MeasureTwiceLeafInteractor): void {
    for (const s of ["Front", "Back", "Left", "Right"]) {
      expect(it.enabled(`RailLabel_${s}`)).toBe(true)
      expect(it.text(`RailLabel_${s}`).text.includes(" cm")).toBe(true)
    }
  }

  async run(): Promise<void> {
    const it = new MeasureTwiceLeafInteractor()
    await it.toPositioning(0) // Oval 43x36 via real pinches
    expect(it.enabled("Template")).toBe(true)
    this.checkLabels(it)
    const ovalWidth = this.outlineWidth()
    const ovalLR = it.ctrl.leftRail + it.ctrl.rightRail

    await it.tap("ChangeSinkButton") // real pinch back to the cards
    expect(it.ctrl.state).toBe("pickSink")
    await it.tap("SinkCard_2") // Large 53x38
    expect(it.ctrl.state).toBe("positioning")
    this.checkLabels(it)
    const largeWidth = this.outlineWidth()
    const largeLR = it.ctrl.leftRail + it.ctrl.rightRail

    print(`dc2: outline width oval=${ovalWidth.toFixed(2)} large=${largeWidth.toFixed(2)}; L+R oval=${ovalLR} large=${largeLR}`)
    expect(largeWidth - ovalWidth).toBeGreaterThan(8) // 53 - 43 = 10 cm wider at real size
    expect(ovalLR - largeLR).toBeCloseTo(10, 3)
  }
}
