
const create = (type, { parent, ...props }) => {

    let element = document.createElementNS('http://www.w3.org/2000/svg', type)

    for (let [key, value] of Object.entries(props)) {

        element.setAttributeNS(null, key, value)

    }

    if (parent) {

        parent.appendChild(element)

    }

    return element

}

class SvgTimelineHelper {

    constructor(timeline) {

        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

        for (let division of timeline.rootContainer.allChildren) {

            let g = create('g', { parent:svg })
            g.classList.add(`node${division.nodeId}`)

            let y = 10 * division.ancestors.length
            let x1 = division.range.min * .5
            let x2 = division.range.max * .5
            create('line', { parent:g, x1, x2, y1:y, y2:y, 'stroke':division.props.color, 'stroke-width':3 })
            create('line', { parent:g, x1:x1, x2:x1, y1:y-4, y2:y+4, 'stroke':division.props.color, 'stroke-width':1 })
            create('line', { parent:g, x1:x2, x2:x2, y1:y-4, y2:y+4, 'stroke':division.props.color, 'stroke-width':1 })

        }

        for (let division of timeline.headContainer.allChildren) {

            let g = create('g', { parent:svg })
            g.classList.add(`node${division.nodeId}`)

            let y = 40 + 10 * division.ancestors.length
            let x1 = division.range.min * .5
            let x2 = division.range.max * .5
            create('line', { parent:g, x1, x2, y1:y, y2:y, 'stroke':division.props.color, 'stroke-width':3 })
            create('line', { parent:g, x1:x1, x2:x1, y1:y-4, y2:y+4, 'stroke':division.props.color, 'stroke-width':1 })
            create('line', { parent:g, x1:x2, x2:x2, y1:y-4, y2:y+4, 'stroke':division.props.color, 'stroke-width':1 })

        }

        Object.assign(this, {

            timeline,
            svg,

        })

    }

}

export { SvgTimelineHelper }
