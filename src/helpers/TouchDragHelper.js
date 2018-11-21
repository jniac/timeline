
import DragHelper from './DragHelper.js'

let init = (pointer) => {

    let currentTouchIdentifier

    window.addEventListener('touchstart', (event) => {

        console.log(event)

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

class TouchDragHelper extends DragHelper {

    constructor(timeline, { target = document.body, direction = 'biggestXorY', overShoot = 1.5, limit = 200 } = {}) {

        super({ timeline, target, direction, overShoot, limit })

        init(this.pointer)

    }

}

export { TouchDragHelper }
