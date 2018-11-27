
import DragHelper from './DragHelper.js'

let init = (pointer) => {

    window.addEventListener('mousedown', (event) => {

        let { target, clientX:x, clientY:y } = event

        pointer.dragStart(target, x, y)

    })

    window.addEventListener('mousemove', (event) => {

        let { clientX:x, clientY:y } = event

        if (pointer.dragging) {

            pointer.dragMove(x, y)

        } else {

            pointer.move(x, y)

        }

    })

    window.addEventListener('mouseup', (event) => {

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
