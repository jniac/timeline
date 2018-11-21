
import Mth from '../math/Mth.js'
import * as events from '../events/Dispatcher.js'
import * as utils from '../utils/utils.js'
import Pointer from './Pointer.js'



let pointer = new Pointer()

class DragHelper {

    constructor({ timeline, target, direction, overShoot, limit }) {

        this.set({ timeline, target, direction, overShoot, limit })

        this.init()

    }

    get pointer() { return pointer }

    set(props) {

        Object.assign(this, props)

    }

    init() {

        let { pointer, target, timeline, overShoot, limit } = this

        let headPosition = 0

        events.on(target, 'pointer-drag-start', () => {

            headPosition = timeline.head.position

            timeline.head.mobileActive = false

        })

        events.on(target, 'pointer-drag-move', () => {

            let delta = this.getDelta(pointer.dx, pointer.dy)

            headPosition += -delta

            let { min, max } = timeline.rootContainer.range
            let limitedPosition = Mth.limited(headPosition, min, max, limit)

            timeline.head.setProps({ position:limitedPosition })

        })

        events.on(target, 'pointer-drag-end', () => {

            timeline.head.mobileActive = true
            timeline.head.mobile.position = timeline.head.position
            timeline.head.mobile.velocity = -this.getDelta(pointer.vx, pointer.vy) * overShoot

        })

    }

    getDelta(x, y) {

        let { direction } = this

        return (

            direction === 'x' ? x :
            direction === 'y' ? y :
            direction === 'biggestXorY' ? utils.biggest(x, y) :
            0

        )

    }

}

export default DragHelper
