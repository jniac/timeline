
import Mth from '../math/Mth.js'

const greater = (number, ...numbers) => {

    let max = Math.abs(number)
    let maxSign = number > 0 ? 1 : -1

    for (let number of numbers) {

        let abs = Math.abs(number)

        if (abs > max) {

            max = abs
            maxSign = number > 0 ? 1 : -1

        }

    }

    return max * maxSign

}

class MouseWheelHelper {

    constructor(timeline, { target = window, direction = 'y' } = {}) {

        Object.assign(this, { direction })

        target.addEventListener('wheel', (event) => {

            let { direction } = this

            let delta =
                direction === 'y' ? event.deltaY :
                direction === 'x' ? event.deltaX :
                direction === 'greaterXorY' ? greater(event.deltaX, event.deltaY) :
                0

            let value = Mth.clamp(timeline.head.position.basis + delta, timeline.rootContainer.range.min, timeline.rootContainer.range.max - timeline.head.width)

            timeline.head.position.basis = value
            timeline.headContainer.update()
            timeline.head.updateHead()

        })

    }

}

export { MouseWheelHelper }
