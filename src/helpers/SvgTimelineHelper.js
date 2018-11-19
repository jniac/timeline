
const makeSvg = (elementOrType, { parent, ...props }) => {

    let element = typeof elementOrType === 'object'
        ? elementOrType
        : document.createElementNS('http://www.w3.org/2000/svg', elementOrType)

    for (let [key, value] of Object.entries(props)) {

        element.setAttributeNS(null, key, value)

    }

    if (parent) {

        parent.appendChild(element)

    }

    return element

}

const drawDivision = (svg, division, offsetY = 0) => {

    let position = division.range.position * .5
    let width = division.range.width * .5
    let y = 10 * division.ancestors.length + offsetY

    let g = makeSvg('g', { parent:svg, stroke:division.props.color, 'stroke-width':3, transform:`translate(${position}, 0)` })
    g.classList.add(`node${division.nodeId}`)

    let lineMain = makeSvg('line',  { parent:g, x1:0, x2:width, y1:y, y2:y })
    let lineStart = makeSvg('line', { parent:g, x1:0, x2:0, y1:y-4, y2:y+4, 'stroke-width':1 })
    let lineEnd = makeSvg('line',   { parent:g, x1:width, x2:width, y1:y-4, y2:y+4, 'stroke-width':1 })

    const update = () => {

        let position = division.range.position * .5
        let width = division.range.width * .5

        makeSvg(g, { transform:`translate(${position}, 0)` })
        makeSvg(lineEnd, { x1:width, x2:width })

    }

    division.on('update', update)

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
