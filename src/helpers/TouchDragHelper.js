
import * as utils from '../utils/utils.js'
import Mth from '../math/Mth.js'
import * as events from '../events/Dispatcher.js'

const now = () => performance.now()

let touch = {

    x: 0,
    y: 0,
    dx: 0,
    dy: 0,

    t: now(),

}

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

        events.fire(event.target, 'touch-drag-start', { propagate:element => element.parentElement })

    })

    window.addEventListener('touchmove', (event) => {

        let [eventTouch] = event.targetTouches
        let { clientX:x, clientY:y } = eventTouch

        let t = now()
        let dt = (t - touch.t) / 1e3

        touch.t = t

        touch.dx = x - touch.x
        touch.dy = y - touch.y
        touch.x = x
        touch.y = y
        touch.vx = touch.dx / dt
        touch.vy = touch.dy / dt

        events.fire(event.target, 'touch-drag-move', { propagate:element => element.parentElement })

    })

    window.addEventListener('touchend', (event) => {

        // NOTE: ignore multi-touches
        if (event.touches.length > 0)
            return

        touch.active = false

        events.fire(event.target, 'touch-drag-end', { propagate:element => element.parentElement })

    })

    // cancel init
    init = () => {}

}

class Mobile {

    constructor() {

        this.position = 0
        this.velocity = 0
        this.friction = .99

    }

    update(dt = 1/60) {

        let { position, velocity, friction } = this

        let f = 1 - friction

        position += velocity * (f === 1 ? dt : (f ** dt - 1) / Math.log(f))
        velocity *= f ** dt

        Object.assign(this, { position, velocity, friction })

    }

}

class TouchDragHelper {

    constructor(timeline, { target = document.body, direction = 'biggestXorY', limit = 200 } = {}) {

        init()

        let mobile = new Mobile()
        timeline.onUpdate.add(() => {

            if (mobile.active) {

                mobile.update()

                let { min, max } = timeline.rootContainer.range

                if (mobile.position < min)
                    mobile.position += (min - mobile.position) / 4

                if (mobile.position > max)
                    mobile.position += (max - mobile.position) / 4

                timeline.head.position.basis = mobile.position
                timeline.updateHeads()

            }


        })

        Object.assign(this, { direction })

        let position

        events.on(target, 'touch-drag-start', () => {

            position = timeline.head.position.basis

            mobile.active = false

        })

        events.on(target, 'touch-drag-move', () => {

            let delta = this.getDelta(touch.dx, touch.dy)

            position += -delta

            let { min, max } = timeline.rootContainer.range

            timeline.head.position.basis = Mth.limited(position, min, max, limit)
            timeline.updateHeads()

        })

        events.on(target, 'touch-drag-end', () => {

            mobile.active = true
            mobile.position = timeline.head.position.basis
            mobile.velocity = -this.getDelta(touch.vx, touch.vy)

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
