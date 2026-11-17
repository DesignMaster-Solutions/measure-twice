import {scenariosIndex} from "Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator"
import {ScenarioMetadata} from "Leaf.lspkg/Scenarios/scenario/ScenarioMetadata"
import {Dc1SlabHereShowsCards} from "./Dc1SlabHereShowsCards"
import {Dc2CardLaysOutline} from "./Dc2CardLaysOutline"
import {Dc3DragFrontAmberLockBlocked} from "./Dc3DragFrontAmberLockBlocked"
import {Dc4CenterEqualGreen} from "./Dc4CenterEqualGreen"
import {Dc5SliderTurnsAmber} from "./Dc5SliderTurnsAmber"
import {Dc6LockMarkerSteps} from "./Dc6LockMarkerSteps"
import {Dc7SummaryLockedValues} from "./Dc7SummaryLockedValues"
import {Dc8ArmReachesControls} from "./Dc8ArmReachesControls"

@component
export class LeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex: ScenarioMetadata[] = [
    {id: "dc1-slab-here-shows-cards", typename: Dc1SlabHereShowsCards.getTypeName()},
    {id: "dc2-card-lays-outline", typename: Dc2CardLaysOutline.getTypeName()},
    {id: "dc3-drag-front-amber-lock-blocked", typename: Dc3DragFrontAmberLockBlocked.getTypeName()},
    {id: "dc4-center-equal-green", typename: Dc4CenterEqualGreen.getTypeName()},
    {id: "dc5-slider-turns-amber", typename: Dc5SliderTurnsAmber.getTypeName()},
    {id: "dc6-lock-marker-steps", typename: Dc6LockMarkerSteps.getTypeName()},
    {id: "dc7-summary-locked-values", typename: Dc7SummaryLockedValues.getTypeName()},
    {id: "dc8-ik-arm-reaches-controls", typename: Dc8ArmReachesControls.getTypeName()},
  ]
}
