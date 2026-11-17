import {Scenario} from "Leaf.lspkg/Scenarios/scenario/Scenario"
import {expect} from "Leaf.lspkg/Utils/common/Expect"
import {sleep} from "Leaf.lspkg/Utils/common/Utils"
import {MeasureTwiceLeafInteractor} from "./MeasureTwiceLeafInteractor"

// DC1: pinching "Slab is here" shows the three sink cards along the back edge.
@component
export class Dc1SlabHereShowsCards extends Scenario {
  async run(): Promise<void> {
    const it = new MeasureTwiceLeafInteractor()
    await sleep(800)
    it.ctrl.newLayout()
    await sleep(300)
    expect(it.ctrl.state).toBe("findSlab")
    for (let i = 0; i < 3; i++) expect(it.enabled(`SinkCard_${i}`)).toBe(false)

    await it.tap("SlabHereButton") // real SIK trigger
    expect(it.ctrl.state).toBe("pickSink")
    for (let i = 0; i < 3; i++) expect(it.enabled(`SinkCard_${i}`)).toBe(true)
    expect(it.enabled("SlabHereButton")).toBe(false)
  }
}
