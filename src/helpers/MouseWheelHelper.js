
import Mth from '../math/Mth.js'
import * as utils from '../utils/utils.js'

class MouseWheelHelper {

    constructor(timeline, { target = window, direction = 'y' } = {}) {

        Object.assign(this, { direction })

        target.addEventListener('wheel', (event) => {

            let { direction } = this

            let delta =
                direction === 'y' ? event.deltaY :
                direction === 'x' ? event.deltaX :
                direction === 'biggestXorY' ? utils.biggest(event.deltaX, event.deltaY) :
                0

            let value = timeline.head.position.basis + delta
            value = Mth.clamp(value, timeline.rootContainer.range.min, timeline.rootContainer.range.max - timeline.head.width)

            timeline.head.position.basis = value
            timeline.updateHeads()

        })

    }

}

export { MouseWheelHelper }
