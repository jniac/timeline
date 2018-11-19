
const makeSvg = (elementOrTypeOrArray, { parent, ...props }) => {

    if (elementOrTypeOrArray instanceof Array) {

        return elementOrTypeOrArray.map(item => makeSvg(item, { parent, ...props }))

    }

    let element = typeof elementOrTypeOrArray === 'object'
        ? elementOrTypeOrArray
        : document.createElementNS('http://www.w3.org/2000/svg', elementOrTypeOrArray)

    for (let [key, value] of Object.entries(props)) {

        element.setAttributeNS(null, key, value)

    }

    if (parent) {

        parent.appendChild(element)

    }

    return element

}

let defaultColors = ['#33f', '#f33', '#f3f']

const drawDivision = (svg, division, offsetY = 0) => {

    let scale = 1/4

    let position = division.range.position * scale
    let width = division.range.width * scale
    let y = 10 * division.ancestors.length + offsetY

    let color = division.props.color || defaultColors[division.nodeId % defaultColors.length]

    let g = makeSvg('g', { parent:svg, stroke:color, transform:`translate(${position}, 0)` })
    g.classList.add(`node${division.nodeId}`)

    let lineMain = makeSvg('line',  { parent:g, x1:0, x2:width, y1:y, y2:y })
    let lineStart = makeSvg('line', { parent:g, x1:0, x2:0, y1:y-4, y2:y+4 })
    let lineEnd = makeSvg('line',   { parent:g, x1:width, x2:width, y1:y-4, y2:y+4 })

    const update = () => {

        let position = division.range.position * scale
        let width = division.range.width * scale

        makeSvg(g, { transform:`translate(${position}, 0)` })
        makeSvg(lineEnd, { x1:width, x2:width })

    }

    division.on('update', update)

    division.on(/main-overlapEnter/, () => makeSvg([lineMain, lineStart, lineEnd], { 'stroke-width':3 }))
    division.on(/main-overlapExit/, () => makeSvg([lineMain, lineStart, lineEnd], { 'stroke-width':1 }))

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
