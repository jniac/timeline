
import Mth from '../math/Mth.js'

let mouse = {

    x: 0,
    y: 0,

}

let init = () => {

    window.addEventListener('mousemove', (event) => {

        let { clientX:x, clientY:y } = event

        mouse.dx = x - mouse.x
        mouse.dy = y - mouse.y

        mouse.x = x
        mouse.y = y

    })

    // cancel init
    init = () => {}

}

class MouseDragHelper {

    constructor(timeline, target = window) {

        init()

        const onMouseMove = () => {

            let value = timeline.head.position.basis - mouse.dy
            value = Mth.clamp(value, timeline.rootContainer.range.min, timeline.rootContainer.range.max - timeline.head.width)

            timeline.head.position.basis = value
            timeline.forceUpdateHeads()

        }

        const onMouseUp = (event) => {

            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)

        }

        target.addEventListener('mousedown', (event) => {

            window.addEventListener('mousemove', onMouseMove)
            window.addEventListener('mouseup', onMouseUp)

        })

    }

}

export { MouseDragHelper }
