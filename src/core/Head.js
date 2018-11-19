
import Division from './Division.js'

let voidLocalHead = {

    ratio: NaN,
    ratioEnd: NaN,

    positionInside: false,

    overlap: 0,

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

            let overlap = division.range.coverage(this.range)
            let overlapEnter = overlap > 0 && old.overlap === 0
            let overlapExit = overlap === 0 && old.overlap > 0

            let positionInside = ratio >= 0 && ratio <= 1
            let progress = overlap || positionInside || old.positionInside

            let values = {

                ratio,
                ratioEnd,

                positionInside,

                overlap,

            }

            division.localHeads.set(this, values)

            if (overlapEnter)
                division.fire(`${name}-overlapEnter`, values)

            if (progress)
                division.fire(`${name}-progress`, values)

            if (overlap)
                division.fire(`${name}-overlap`, values)

            if (overlapExit)
                division.fire(`${name}-overlapExit`, values)

        })

        this.forChildren(head => head.updateHead())

    }

}

export default Head
