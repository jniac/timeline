
import DragHelper from './DragHelper.js'
import windowAddEventListener from '../utils/windowAddEventListener.js'

let init = (pointer) => {

    windowAddEventListener('mousedown', (event) => {

        let { target, clientX:x, clientY:y } = event

        pointer.dragStart(target, x, y)

    })

    windowAddEventListener('mousemove', (event) => {

        let { clientX:x, clientY:y } = event

        if (pointer.dragging) {

            pointer.dragMove(x, y)

        } else {

            pointer.move(x, y)

        }

    })

    windowAddEventListener('mouseup', (event) => {

        pointer.dragEnd()

    })

    // cancel init
    init = () => {}

}

class MouseDragHelper extends DragHelper {

    constructor(timeline, { target, direction = 'biggestXorY', overShoot = 1.5, limit = 200 } = {}) {

        super({ timeline, target, direction, overShoot, limit })

        init(this.pointer)

    }

}

export { MouseDragHelper }
