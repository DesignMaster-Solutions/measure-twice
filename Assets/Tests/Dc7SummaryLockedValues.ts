import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {MeasureTwiceLeafInteractor} from "./MeasureTwiceLeafInteractor"

// DC7: after the fifth Marked the summary appears with the front/back distances shown at lock time.
@component
export class Dc7SummaryLockedValues extends Scenario {
  async run(): Promise<void> {
    const it = new MeasureTwiceLeafInteractor()
    await it.toPositioning(1) // Rectangle 46x33
    const c = it.ctrl
    await it.dragByName("Template", new vec3(0, 0, 0.1), 300) // real drag, small move toward the front
    expect(c.canLock).toBe(true)
    const frontShown = it.text("RailLabel_Front").text // e.g. "9.0 cm"
    const backShown = it.text("RailLabel_Back").text

    await it.tap("LockButton")
    expect(c.isLocked).toBe(true)
    expect(c.lockedRails!.front).toBe(c.frontRail)
    expect(c.lockedRails!.back).toBe(c.backRail)

    for (let i = 0; i < 5; i++) {
      expect(it.enabled("Summary")).toBe(false)
      await it.tap("MarkedButton")
    }
    print(`dc7: shown front="${frontShown}" back="${backShown}" summary="${c.summaryText}"`)
    expect(c.state).toBe("done")
    expect(c.markIndex).toBe(5)
    expect(it.enabled("Summary")).toBe(true)
    const summary = it.text("Summary").text
    expect(summary).toBe(c.summaryText)
    expect(summary.includes(`Front ${frontShown}`)).toBe(true)
    expect(summary.includes(`Back ${backShown}`)).toBe(true)
    expect(it.enabled("NewLayoutButton")).toBe(true)
  }
}
