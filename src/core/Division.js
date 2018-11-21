
import { Node } from '../lib/tree.js'
import { makeDispatcher } from '../events/Dispatcher.js'

import Range from '../math/Range.js'
import { LayoutProperty, WidthProperty } from './LayoutProperties.js'

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
        if (division.width.auto) {

            widthAutoDivisions.unshift(division)
            return

        }

        let referenceDivision = division.parent

        while (referenceDivision.width.auto || referenceDivision.width == 'none') {

            referenceDivision = referenceDivision.parent

        }

        let width = division.width.compute(referenceDivision.range.width, division)
        division.computed.width = width
        division.range.width = width

    })

    for (let division of widthAutoDivisions) {

        let totalWidth = 0

        division.forChildren(child => {

            if (child.layout === 'normal')
                totalWidth += child.range.width

        })

        let width = division.width.compute(totalWidth, division)
        division.computed.width = width
        division.range.width = width

    }

}

const updatePosition = (division) => {

    let offset = 0

    division.forChildren((child) => {

        if (child.layout === 'normal') {

            let position = division.range.position + offset
            child.computed.position = position
            child.range.position = position
            offset += child.computed.width

        } else if (child.layout === 'absolute') {

            // child.range.position = division.range.interpolate(child.position.relative) + child.position.basis
            let position = division.range.position + child.position.compute(division.computed.width, child)
            child.computed.position = position
            child.range.position = position - child.computed.width * child.align

        } else {

            console.warn(`unhandled layout property: ${child.layout}`)

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
        this.position = new LayoutProperty()
        this.width = new WidthProperty()
        this.align = 0

        this.computed = {
            position: 0,
            width: 0,
        }

        this.range = new Range()
        this.bounds = new Range()

        this.localHeads = new WeakMap()

        this.props = consumeProps(this, props)

    }

    updateChildren() {

        updateWidth(this)
        updatePosition(this)
        this.forAllChildren(child => child.fire('update'))

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

        if (typeof selector === 'object') {

            let entries = Object.entries(selector)

            for (let child of this.iAllChildren()) {

                if (entries.every(([key, value]) => child.props[key] === value)) {

                    return child

                }

            }

        }

        if (typeof selector === 'string') {

            if (/^[\w-]+$/.test(selector)) {

                for (let child of this.iAllChildren()) {

                    if (child.props.name === selector) {

                        return child

                    }

                }

            }

        }

    }

    createDivision({ parent = this, ...props }) {

        let division = new Division(props)

        if (!(parent instanceof Division)) {

            let query = parent
            parent = this.fetchDivision(query)

            if (!parent) {
                console.log(this)
                console.log(this.toGraphString())
                throw `oups, parent is ${parent}, ("${query}")`
            }

        }

        parent.append(division)

        return division

    }

    division(query) {

        if (typeof query === 'string' || typeof query === 'number') {

            return this.fetchDivision(query)

        }

    }

    // head relation

}

Object.assign(Division, {

    map,

})

makeDispatcher(Division.prototype)

export default Division
