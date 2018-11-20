
import Division from './Division.js'

let voidLocalHead = {

    ratio: NaN,
    ratioEnd: NaN,

    state: NaN,

    overlap: 0,
    overflow: 0,

}

class Head extends Division {

    constructor(props) {

        super({ layout:'absolute', ...props })

    }

    updateHead() {

        let { name } = this.props

        let { position, width } = this.range
        let positionEnd = position + width

        this.root.rootContainer.forAllChildren((division) => {

            let old = division.localHeads.get(this) || voidLocalHead

            let ratio = division.range.ratio(position)
            let ratioEnd = division.range.ratio(positionEnd)

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
                ratioEnd,

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

        this.forChildren(head => head.updateHead())

    }

}

export default Head
