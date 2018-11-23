
import { groupEvery, makeSvg } from '../utils/utils.js'

let defaultColors = ['#33f', '#f33', '#f3f']

const drawDivision = (helper, division, offsetY = 0, { drawArrow = true } = {}) => {

    const makePoints = (...array) => groupEvery(array, 2).map(point => point.join(',')).join(' ')
    const min = (...args) => Math.min(...args)
    const max = (...args) => Math.max(...args)

    let { scale } = helper

    let position = division.range.position * scale
    let width = division.range.width * scale
    let y = offsetY

    // let color = division.props.color || defaultColors[division.nodeId % defaultColors.length]
    let color = division.props.color || '#333'

    let g = makeSvg('g', { parent:helper.container, stroke:color, transform:`translate(${position}, 0)` })
    g.classList.add(`node${division.nodeId}`)

    let th = 3
    let lineMain = makeSvg('line',  { parent:g, x1:0, x2:width, y1:y, y2:y })
    let lineStart = makeSvg('line', { parent:g, x1:0, x2:0, y1:y-th, y2:y+th })
    let lineEnd = makeSvg('line',   { parent:g, x1:width, x2:width, y1:y-th, y2:y+th })

    if (true) {

        let circle = makeSvg('circle', { parent:g, cx:-division.translate * scale, cy:y, r:1, fill:color })

        division.on('main-stateChange', ({ values:{ state } }) => {
            let r = state === 0 ? 1.5 : 1
            let fill = state === 0 ? '#ddd' : color
            makeSvg(circle, { r, fill })
        })

    }

    if (drawArrow) {

        let a = 2 // arrow margin
        let arrowStart = makeSvg('polyline', { parent:g, fill:'none', stroke:color, points:makePoints(min(width,a)+th*1.2,y-th*1.2,min(width,a),y,min(width,a)+th*1.2,y+th*1.2) })
        let arrowEnd = makeSvg('polyline', { parent:g, fill:'none', stroke:color, points:makePoints(max(0,width-a)-th*1.2,y-th*1.2,max(0,width-a),y,max(0,width-a)-th*1.2,y+th*1.2) })

        division.on('main-stateChange', ({ values:{ state } }) => {
            makeSvg(arrowStart, { visibility:state === -1 ? null : 'hidden' })
            makeSvg(arrowEnd, { visibility:state === 1 ? null : 'hidden' })
        })

    }

    const update = () => {

        let position = division.range.position * scale
        let width = division.range.width * scale

        makeSvg(g, { transform:`translate(${position}, 0)` })
        makeSvg(lineEnd, { x1:width, x2:width })

    }

    division.on('update', update)

    division.on(/main-overlapEnter/, () => makeSvg(lineMain, { 'stroke-width':3 }))
    division.on(/main-overlapExit/, () => makeSvg(lineMain, { 'stroke-width':1 }))

}

const drawLink = (helper, division, offsetY, parentOffsetY) => {

    const mix = (a, b, x) => a * (1 - x) + b * x

    let { scale } = helper

    let x1 = division.parent.range.interpolate(.5) * scale
    let y1 = parentOffsetY
    let x2 = division.range.interpolate(.5) * scale
    let y2 = offsetY

    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/d
    let d = `M ${x1},${y1} C ${x1},${mix(y1,y2,2/3)} ${x2},${mix(y1,y2,1/3)} ${x2},${y2}`
    makeSvg('path', { parent:helper.container, d, stroke:'#333', fill:'none', opacity:.25 })

}

const createStage = (helper, timeline) => {

    let stages = []
    let totalHeight = 0
    let stageMargin = 28

    let heap = [timeline.rootContainer]

    let info = new Map()

    while (heap.length) {

        let array = [...heap]
        heap.length = 0
        let stage = []

        let rect = makeSvg('rect', { parent:helper.container, x:-10, y:totalHeight, width:1000, opacity:.95, fill:'#ddd' })

        for (let division of array) {

            let stageIndex = 0

            while (stage[stageIndex] && stage[stageIndex].some(child => child.range.intersects(division.range))) {

                stageIndex++

            }

            stage[stageIndex] ? stage[stageIndex].push(division) : stage[stageIndex] = [division]

            let offsetY = totalHeight + (stageIndex + .5) * 6 + stageMargin * .5

            drawDivision(helper, division, offsetY)

            info.set(division, { offsetY })

            if (stages.length > 0) {

                drawLink(helper, division, offsetY, info.get(division.parent).offsetY)

            }

            heap.push(...division.children)

        }

        let height = stage.length * 6 + stageMargin

        totalHeight += height

        makeSvg(rect, { height })

        stages.push(stage)

    }

    return { stages, totalHeight }

}

class SvgTimelineHelper {

    constructor(timeline, { scale = 1/16 } = {}) {

        let svg = makeSvg('svg')
        svg.classList.add('svg-timeline-helper')
        let container = makeSvg('g', { parent:svg, transform:'translate(20, 10)' })

        Object.assign(this, {

            timeline,
            svg,
            container,
            scale,

        })

        let stage = createStage(this, timeline)

        for (let division of timeline.headContainer.children) {

            drawDivision(this, division, stage.totalHeight)

        }

    }

    setStyle(props) {

        Object.assign(this.svg.style, props)

        return this

    }

    activeSpaceKey() {

        window.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.setStyle({ display:this.svg.style.display ? null : 'none' })
                event.preventDefault()
            }
        })

        return this

    }

}

export { SvgTimelineHelper }
