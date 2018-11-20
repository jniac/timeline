
import * as utils from '../utils/utils.js'
import Mth from '../math/Mth.js'
import { makeDispatcher } from '../events/Dispatcher.js'

let touch = makeDispatcher({

    x: 0,
    y: 0,
    dx: 0,
    dy: 0,

})

let init = () => {

    window.addEventListener('touchstart', (event) => {

        // NOTE: ignore multi-touches
        if (event.touches.length > 1)
            return

        let [eventTouch] = event.targetTouches
        let { clientX:x, clientY:y } = eventTouch

        touch.active = true
        touch.x = x
        touch.y = y

        touch.fire('start')

    })

    window.addEventListener('touchend', (event) => {

        // NOTE: ignore multi-touches
        if (event.touches.length > 0)
            return

        touch.active = false

        touch.fire('end')

    })

    window.addEventListener('touchmove', (event) => {

        let [eventTouch] = event.targetTouches
        let { clientX:x, clientY:y } = eventTouch

        touch.dx = x - touch.x
        touch.dy = y - touch.y
        touch.x = x
        touch.y = y

    })

    // cancel init
    init = () => {}

}

class TouchDragHelper {

    constructor(timeline, { target = window, direction = 'biggestXorY' } = {}) {

        init()

        Object.assign(this, { direction })

        target.addEventListener('touchmove', () => {

            let { direction } = this

            let delta =
                direction === 'y' ? touch.dy :
                direction === 'x' ? touch.dx :
                direction === 'biggestXorY' ? utils.biggest(touch.dx, touch.dy) :
                0

            let value = timeline.head.position.basis - delta
            value = Mth.clamp(value, timeline.rootContainer.range.min, timeline.rootContainer.range.max - timeline.head.width)

            timeline.head.position.basis = value
            timeline.updateHeads()

        })

    }

}

utils.readonly(TouchDragHelper, {

    touch,

})

export { TouchDragHelper }
