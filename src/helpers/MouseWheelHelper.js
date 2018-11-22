
import * as utils from '../utils/utils.js'

class MouseWheelHelper {

    constructor(timeline, { target = window, direction = 'y' } = {}) {

        Object.assign(this, { direction })

        let delta = 0

        target.addEventListener('wheel', (event) => {

            let { direction } = this

            delta =
                direction === 'y' ? event.deltaY :
                direction === 'x' ? event.deltaX :
                direction === 'biggestXorY' ? utils.biggest(event.deltaX, event.deltaY) :
                0

            timeline.head.mobileActive = true
            timeline.head.mobile.position += delta

        })

    }

}

export { MouseWheelHelper }
