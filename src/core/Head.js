
import Division from './Division.js'
import Mobile from './Mobile.js'

let voidLocalHead = {

    ratio: NaN,
    ratioMin: NaN,
    ratioMax: NaN,

    state: NaN,

    overlap: 0,
    overflow: 0,

}

class Head extends Division {

    constructor(props) {

        super({ layout:'absolute', ...props })


    }

    initPhysics() {

        this.mobile = new Mobile()
        this.physicsActive = false

        this.root.onBeforeUpdate.add(() => {

            let { physicsActive, mobile } = this

            if (physicsActive) {

                mobile.min = timeline.rootContainer.range.min
                mobile.max = timeline.rootContainer.range.max

                mobile.update()

                let { position } = mobile

                this.setProps({ position:Math.round(position) })

            }

        })

    }

    startPhysics({ velocity = 0 }) {

        this.physicsActive = true
        this.mobile.position = this.position
        this.mobile.velocity = velocity

    }

    updatePhysics({ position, velocity, positionDelta }) {

        this.physicsActive = true

        if (position !== undefined)
            this.mobile.position = position

        if (positionDelta !== undefined)
            this.mobile.position += positionDelta

        if (velocity !== undefined)
            this.mobile.velocity = velocity

    }

    stopPhysics() {

        this.physicsActive = false

    }

    updateHead() {

        let { name } = this.props

        let { position } = this
        let positionMin = this.range.min
        let positionMax = this.range.max

        let divisionThatWillFireEvents = []

        this.root.rootContainer.forDescendants((division) => {

            let old = division.localHeads.get(this) || voidLocalHead

            let ratio = division.range.ratio(position)
            let ratioMin = division.range.ratio(positionMin)
            let ratioMax = division.range.ratio(positionMax)

            let intersects = this.range.intersects(division.range, .0001)
            let state = intersects ? 0 : this.range.max < division.range.min ? -1 : 1

            // triggers:
            let stateChange = state !== old.state

            // overlap === 1 when the [head] is entirely covered by the [division]
            let overlap = intersects ? this.range.coverage(division.range) : 0
            let overlapEnter = overlap > 0 && old.overlap === 0
            let overlapExit = overlap === 0 && old.overlap > 0

            // overflow === 1 when the [division] is entirely covered by the [head]
            let overflow = intersects ? division.range.coverage(this.range) : 0
            let overflowEnter = overflow > 0 && old.overflow === 0
            let overflowExit = overflow === 0 && old.overflow > 0

            let progress = stateChange || overlap || old.overlap || overflow || old.overflow

            let values = {

                ratio,
                ratioMin,
                ratioMax,

                state,

                overlap,
                overflow,

            }

            division.localHeads.set(this, values)

            division.triggers = {
                stateChange,
                overlapEnter,
                overlapExit,
                overlap,
                overflowEnter,
                overflowExit,
                overflow,
                progress,
            }

            if (
                stateChange
                || overlapEnter
                || overlapExit
                || overlap
                || overflowEnter
                || overflowExit
                || overflow
                || progress
            )
                divisionThatWillFireEvents.push(division)

        })

        // NOTE:
        // sort the division in order to let the "most significant" division fire events last
        divisionThatWillFireEvents.sort((A, B) => {

            let Avalues = A.localHeads.get(this)
            let Bvalues = B.localHeads.get(this)

            return Math.abs(Bvalues.state) - Math.abs(Avalues.state)

        })

        for (let division of divisionThatWillFireEvents) {

            let values = division.localHeads.get(this)
            let eventOptions = { values }
            let {
                stateChange,
                overlapEnter,
                overlapExit,
                overlap,
                overflowEnter,
                overflowExit,
                overflow,
                progress,
            } = division.triggers

            if (stateChange)
                division.fire(`${name}-stateChange`, eventOptions)

            if (overlapEnter)
                division.fire(`${name}-overlapEnter`, eventOptions)

            if (overflowEnter)
                division.fire(`${name}-overflowEnter`, eventOptions)

            if (progress)
                division.fire(`${name}-progress`, eventOptions)

            if (overlap)
                division.fire(`${name}-overlap`, eventOptions)

            if (overflow)
                division.fire(`${name}-overflow`, eventOptions)

            if (overflowExit)
                division.fire(`${name}-overflowExit`, eventOptions)

            if (overlapExit)
                division.fire(`${name}-overlapExit`, eventOptions)

        }

    }

}

export default Head
