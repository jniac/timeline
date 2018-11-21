
import { Node } from '../lib/tree.js'
import { makeDispatcher } from '../events/Dispatcher.js'

import Range from '../math/Range.js'
import LayoutProperty from './LayoutProperty.js'

const updateWidth = (parent) => {

    let widthAutoDivisions = []

    parent.forAllChildren((division) => {

        let prop = LayoutProperty.get(division.props.width)

        if (prop.auto) {

            widthAutoDivisions.unshift(division)
            return

        }

        let referenceDivision = division.parent
        let referenceProp = LayoutProperty.get(referenceDivision.props.width)

        while (referenceProp.auto || referenceProp.none) {

            referenceDivision = referenceDivision.parent
            referenceProp = LayoutProperty.get(referenceDivision.props.width)

        }

        let width = prop.compute(referenceDivision.width, division, referenceDivision)
        division.range.width = division.width = width

    })

    for (let division of widthAutoDivisions) {

        let totalWidth = 0

        division.forChildren(child => {

            if (child.layout === 'normal')
                totalWidth += child.width

        })

        let prop = LayoutProperty.get(division.props.width)
        let width = prop.compute(totalWidth, division)
        division.range.width = division.width = width

    }

}

const updatePosition = (parent) => {

    let offset = 0

    parent.forChildren((division) => {

        if (division.props.layout === 'normal') {

            let position = parent.position + offset
            division.position = position
            division.range.position = position
            offset += division.width

        } else if (division.props.layout === 'absolute') {

            let prop = LayoutProperty.get(division.props.position)

            let position = parent.range.position + prop.compute(parent.width, division)
            division.position = position
            division.range.position = position - division.width * division.align

        } else {

            console.warn(`unhandled layout property: ${division.props.layout}`)

        }

        updatePosition(division)

    })

}

let map = new Map()

class Division extends Node {

    constructor(props) {

        super()

        map.set(this.nodeId, this)

        this.layout = 'normal'
        this.position = 0
        this.width = 0
        this.align = 0

        this.range = new Range()
        this.bounds = new Range()

        this.localHeads = new WeakMap()

        // this.props = consumeProps(this, props)
        this.props = {
            position: 0,
            width: 0,
            layout: 'normal',
            ...props
        }

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
