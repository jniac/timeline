
import * as utils from '../utils/utils.js'
import Mth from '../math/Mth.js'
import * as events from '../events/Dispatcher.js'
import Pointer from './Pointer.js'

const now = () => performance.now()



let pointer = new Pointer()

let init = () => {

    let currentTouchIdentifier

    window.addEventListener('touchstart', (event) => {

        let [eventTouch] = event.changedTouches

        // NOTE: ignore multi-touches
        if (event.touches.length === 1) {

            let { clientX:x, clientY:y } = eventTouch

            currentTouchIdentifier = eventTouch.identifier

            pointer.dragStart(event.target, x, y)

        } else {

            pointer.dragBrutalEnd()

        }

    })

    window.addEventListener('touchmove', (event) => {

        let [eventTouch] = event.changedTouches

        if (eventTouch.identifier === currentTouchIdentifier) {

            let { clientX:x, clientY:y } = eventTouch

            pointer.dragMove(x, y)

        }

    })

    window.addEventListener('touchend', (event) => {

        let [eventTouch] = event.changedTouches

        if (eventTouch.identifier === currentTouchIdentifier) {

            pointer.dragEnd()

        }

    })

    // cancel init
    init = () => {}

}

class TouchDragHelper {

    constructor(timeline, { target = document.body, direction = 'biggestXorY', overShoot = 1.5, limit = 200 } = {}) {

        init()

        Object.assign(this, { direction })

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

utils.readonly(TouchDragHelper, {

    pointer,

})

export { TouchDragHelper }
