
import { Node } from '../lib/tree.js'

import Range from '../math/Range.js'
import { WidthProperty, PositionProperty } from './LayoutProperties.js'

const consumeProps = (division, props) => {

    let rest = {}

    if (props) {

        for (let [key, value] of Object.entries(props)) {

            if (key === 'width') {

                division.width.parse(value)

            } else if (key === 'position') {

                division.position.parse(value)

            } else if (key === 'layout') {

                division.layout = value

            } else {

                rest[key] = value

            }

        }

    }

    return rest

}

const updateWidth = (division) => {

    let widthAutoDivisions = []

    division.forAllChildren((division) => {

        // NOTE: '==' is used there, because division.valueOf() is used under the hood, be careful
        if (division.width == 'auto') {

            widthAutoDivisions.unshift(division)
            return

        }

        let referenceDivision = division.parent

        while (referenceDivision.width == 'auto' || referenceDivision.width == 'none') {

            referenceDivision = referenceDivision.parent

        }

        division.range.width = division.width.compute(referenceDivision.range.width, division)

    })

    for (let division of widthAutoDivisions) {

        let width = 0

        division.forChildren(child => {

            if (child.layout === 'normal')
                width += child.range.width

        })

        division.range.width = width

    }

}

const updatePosition = (division) => {

    let offset = 0

    division.forChildren((child) => {

        if (child.layout === 'normal') {

            child.range.position = division.range.position + offset
            offset += child.range.width

        } else {

            child.range.position = division.range.interpolate(child.position.relative) + child.position.basis

        }

        updatePosition(child)

    })

}

let map = new Map()

class Division extends Node {

    constructor(props) {

        super()

        map.set(this.nodeId, this)

        this.layout = 'normal'
        this.position = new PositionProperty()
        // this.anchorPosition = new LayoutProperty()
        this.width = new WidthProperty()
        this.relativeMode = 'PARENTS'

        this.range = new Range()
        this.bounds = new Range()

        this.props = {

            color: '#' + Math.floor(0xffffff * Math.random()).toString(16).padStart(6, '0'),
            ...consumeProps(this, props),
        }

    }

    update() {

        updateWidth(this)
        updatePosition(this)

    }

    fetchDivision(selector) {

        if (typeof selector === 'number' || /^#\d+$/.test(selector)) {

            let id = typeof selector === 'number' ? selector : Number(selector.slice(1))

            for (let child of this.iAllChildren()) {

                if (child.nodeId === id) {

                    return child

                }

            }

        }

    }

    createDivision(props) {

        let division = new Division(props)

        this.append(division)

        return division

    }

    division(query) {

        if (typeof query === 'string' || typeof query === 'number') {

            return this.fetchDivision(query)

        }

    }

}

Object.assign(Division, {
    map,
})

export default Division
