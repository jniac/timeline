
const makeSvg = (elementOrType, { parent, ...props }) => {

    let element = elementOrType === 'object' ? elementOrType : document.createElementNS('http://www.w3.org/2000/svg', elementOrType)

    for (let [key, value] of Object.entries(props)) {

        element.setAttributeNS(null, key, value)

    }

    if (parent) {

        parent.appendChild(element)

    }

    return element

}

const drawDivision = (svg, division, offsetY = 0) => {

    let transform = `translate(${division.range.position * .5}, 0)`
    let x2 = division.range.width * .5
    let y = 10 * division.ancestors.length + offsetY

    let g = makeSvg('g', { parent:svg, stroke:division.props.color, 'stroke-width':3, transform })
    g.classList.add(`node${division.nodeId}`)

    makeSvg('line', { parent:g, x1:0, x2, y1:y, y2:y })
    makeSvg('line', { parent:g, x1:0, x2:0, y1:y-4, y2:y+4, 'stroke-width':1 })
    makeSvg('line', { parent:g, x1:x2, x2:x2, y1:y-4, y2:y+4, 'stroke-width':1 })

    // division.on('move', () => {
    //
    //     let transform = `translate(${division.range.position * .5}, 0)`
    //
    //     makeSvg(g, { transform })
    //
    // })

}

class SvgTimelineHelper {

    constructor(timeline) {

        let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')

        for (let division of timeline.rootContainer.allChildren) {

            drawDivision(svg, division)

        }

        for (let division of timeline.headContainer.allChildren) {

            drawDivision(svg, division, 40)

        }

        Object.assign(this, {

            timeline,
            svg,

        })

    }

}

export { SvgTimelineHelper }
