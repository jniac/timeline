
import events from '../events.js'

const now = () => performance.now()

class Pointer {

    constructor() {

        let dragTarget = null
        let dragging = false
        let t = now()
        let x = 0
        let y = 0
        let dx = 0
        let dy = 0
        let vx = 0
        let vy = 0

        this.set({ dragTarget, dragging, t, x, y, dx, dy, vx, vy })

    }

    set(props) {

        Object.assign(this, props)

    }

    dragStart(dragTarget, x, y) {

        if (this.dragging === true)
            throw `Pointer.dragStart: oups, dragging is already true`

        let dragging = true
        let t = now()
        let dx = 0
        let dy = 0
        let vx = 0
        let vy = 0

        this.set({ dragTarget, dragging, t, x, y, dx, dy, vx, vy })

        events.fire(this.dragTarget, 'pointer-drag-start', { pointer:this, propagate:element => element.parentElement })

    }

    move(x, y) {

        let t = now()
        let dt = (t - this.t) / 1e3 // s (and not ms)
        let dx = x - this.x
        let dy = y - this.y
        let vx = dx / dt
        let vy = dy / dt

        this.set({ t, dt, x, y, dx, dy, vx, vy })

        // NOTE: for the time being, do not fire event on move (quite ennoying because of target handling)

    }

    dragMove(x, y) {

        if (this.dragging === false)
            throw `Pointer.dragMove: oups, dragging is false`

        this.move(x, y)

        events.fire(this.dragTarget, 'pointer-drag-move', { pointer:this, propagate:element => element.parentElement })

    }

    dragEnd() {

        if (this.dragging === false)
            throw `Pointer.dragEnd: oups, dragging is already false`

        let { dragTarget } = this

        this.set({ dragging:false, dragTarget:null })

        events.fire(dragTarget, 'pointer-drag-end', { pointer:this, propagate:element => element.parentElement })

    }

    dragBrutalEnd() {

        let dx = 0
        let dy = 0
        let vx = 0
        let vy = 0

        this.set({ dx, dy, vx, vy })

        this.end()

    }

}

export default Pointer
