
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

    createMobile() {

        this.mobile = new Mobile()
        this.mobileActive = false

        this.root.onBeforeUpdate.add(() => {

            let { mobileActive, mobile } = this

            if (mobileActive) {

                mobile.min = timeline.rootContainer.range.min
                mobile.max = timeline.rootContainer.range.max

                mobile.update()

                let { position } = mobile

                this.setProps({ position:Math.round(position) })

            }

        })

    }

    updateHead() {

        let { name } = this.props

        let { position } = this
        let positionMin = this.range.min
        let positionMax = this.range.max

        this.root.rootContainer.forDescendants((division) => {

            let old = division.localHeads.get(this) || voidLocalHead

            let ratio = division.range.ratio(position)
            let ratioMin = division.range.ratio(positionMin)
            let ratioMax = division.range.ratio(positionMax)

            let intersects = this.range.intersects(division.range, .0001)
            let state = intersects ? 0 : this.range.max < division.range.min ? -1 : 1

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

            let eventOptions = { values }

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

        })

    }

}

export default Head
