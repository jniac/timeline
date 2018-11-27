
import Mth from '../math/Mth.js'
import events from '../events.js'
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

        let { pointer, target = document.body, timeline, overShoot, limit } = this

        let headPosition = 0

        const onPointerDragStart = () => {

            headPosition = timeline.head.position

            timeline.head.stopPhysics()

        }

        const onPointerDragMove = () => {

            let delta = this.getDelta(pointer.dx, pointer.dy)

            headPosition += -delta

            let { min, max } = timeline.rootContainer.range
            let limitedPosition = Mth.limited(headPosition, min, max, limit)

            timeline.head.setProps({ position:limitedPosition })

        }

        const onPointerDragEnd = () => {

            let velocity = -this.getDelta(pointer.vx, pointer.vy) * overShoot

            timeline.head.startPhysics({ velocity })

        }

        events.on(target, 'pointer-drag-start', onPointerDragStart)
        events.on(target, 'pointer-drag-move', onPointerDragMove)
        events.on(target, 'pointer-drag-end', onPointerDragEnd)

        timeline.on('destroy', () => {

            events.off(target, 'pointer-drag-start', onPointerDragStart)
            events.off(target, 'pointer-drag-move', onPointerDragMove)
            events.off(target, 'pointer-drag-end', onPointerDragEnd)

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
