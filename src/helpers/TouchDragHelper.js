
import * as utils from '../utils/utils.js'
import Mth from '../math/Mth.js'
import * as events from '../events/Dispatcher.js'

const now = () => performance.now()

let touch = {

    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    vx: 0,
    vy: 0,

    t: now(),

    current: null,

    start(touchIdentifier, target, x, y) {

        Object.assign(this, {

            active: true,
            x,
            y,
            dx: 0,
            dy: 0,
            vx: 0,
            vy: 0,
            t: now(),
            target,
            touchIdentifier,

        })

        events.fire(this.target, 'touch-drag-start', { propagate:element => element.parentElement })

    },

    move(x, y) {

        let t = now()
        let dt = (t - this.t) / 1e3 // s (and not ms)
        let dx = x - this.x
        let dy = y - this.y
        let vx = dx / dt
        let vy = dy / dt

        Object.assign(this, {

            x,
            y,
            dx,
            dy,
            vx,
            vy,
            t,

        })

        events.fire(this.target, 'touch-drag-move', { propagate:element => element.parentElement })

    },

    end() {

        Object.assign(this, {

            active: false,

        })

        events.fire(event.target, 'touch-drag-end', { propagate:element => element.parentElement })

    },

    brutalEnd() {

        Object.assign(this, {

            dx: 0,
            dy: 0,
            vx: 0,
            vy: 0,

        })

        this.end()

    },

}

let init = () => {

    let currentTouch

    window.addEventListener('touchstart', (event) => {

        let [eventTouch] = event.changedTouches

        // NOTE: ignore multi-touches
        if (event.touches.length === 1) {

            let { clientX:x, clientY:y } = eventTouch

            touch.start(eventTouch.identifier, event.target, x, y)


        } else {

            touch.brutalEnd()

        }

    })

    window.addEventListener('touchmove', (event) => {

        let [eventTouch] = event.changedTouches

        if (touch.active && touch.touchIdentifier === eventTouch.identifier) {

            let { clientX:x, clientY:y } = eventTouch

            touch.move(x, y)

        }

    })

    window.addEventListener('touchend', (event) => {

        let [eventTouch] = event.changedTouches

        if (touch.active && touch.touchIdentifier === eventTouch.identifier) {

            touch.end()

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

        events.on(target, 'touch-drag-start', () => {

            headPosition = timeline.head.position

            timeline.head.mobileActive = false

        })

        events.on(target, 'touch-drag-move', () => {

            let delta = this.getDelta(touch.dx, touch.dy)

            headPosition += -delta

            let { min, max } = timeline.rootContainer.range
            let limitedPosition = Mth.limited(headPosition, min, max, limit)

            timeline.head.setProps({ position:limitedPosition })


        })

        events.on(target, 'touch-drag-end', () => {

            timeline.head.mobileActive = true
            timeline.head.mobile.position = timeline.head.position
            timeline.head.mobile.velocity = -this.getDelta(touch.vx, touch.vy) * overShoot

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

    touch,

})

export { TouchDragHelper }
