
import windowAddEventListener from '../utils/windowAddEventListener.js'
import { groupEvery, makeSvg } from '../utils/utils.js'

let defaultColors = ['#33f', '#f33', '#f3f']

const min = (...args) => Math.min(...args)
const max = (...args) => Math.max(...args)
const shortNumber = n => n.toFixed(1).replace(/\.0$/, '')

const getColor = (division) => {

    while (division) {

        if ('color' in division.props)
            return division.props.color

        division = division.parent

    }

    return '#333'

}

const drawDivision = (helper, division, offsetY = 0, { drawArrow = true, drawGhost = false } = {}) => {

    const makePoints = (...array) => groupEvery(array, 2).map(point => point.map(shortNumber).join(',')).join(' ')

    let { timeline, scale } = helper

    let position = division.range.position * scale
    let width = division.range.width * scale
    let y = offsetY

    // let color = division.props.color || defaultColors[division.nodeId % defaultColors.length]
    let color = getColor(division)

    let g = makeSvg('g', { parent:helper.container, stroke:color, transform:`translate(${position}, 0)` })
    g.classList.add(`node${division.nodeId}`)

    let th = 3
    let lineMain = makeSvg('line',  { parent:g, x1:0, x2:width, y1:y, y2:y })
    let lineStart = makeSvg('line', { parent:g, x1:0, x2:0, y1:y-th, y2:y+th })
    let lineEnd = makeSvg('line',   { parent:g, x1:width, x2:width, y1:y-th, y2:y+th })

    if (true) {

        let circle = makeSvg('circle', { parent:g, cx:-division.translate * scale, cy:y, r:1, fill:color })

        let onStateChange = () => {

            let { state } = timeline.head.getLocalValues(division)
            let r = state === 0 ? 1.5 : 1
            let fill = state === 0 ? '#ddd' : color
            makeSvg(circle, { r, fill })

        }

        division.on('main-stateChange', onStateChange)

    }

    if (drawArrow) {

        let endPoints = width => makePoints(max(0,width-a)-th*1.2,y-th*1.2,max(0,width-a),y,max(0,width-a)-th*1.2,y+th*1.2)

        let a = 2 // arrow margin
        let arrowStart = makeSvg('polyline', { parent:g, fill:'none', stroke:color, points:makePoints(min(width,a)+th*1.2,y-th*1.2,min(width,a),y,min(width,a)+th*1.2,y+th*1.2) })
        let arrowEnd = makeSvg('polyline', { parent:g, fill:'none', stroke:color, points:endPoints(width) })

        division.on('main-stateChange', ({ values:{ state } }) => {
            makeSvg(arrowStart, { visibility:state === -1 ? null : 'hidden' })
            makeSvg(arrowEnd, { visibility:state === 1 ? null : 'hidden' })
        })

        division.on('update', () => {

            let width = division.range.width * scale
            makeSvg(arrowEnd, { points:endPoints(width) })

        })

    }

    if (drawGhost) {

        let ghostLine = makeSvg('line', { parent:g, y2:offsetY, stroke:color, opacity:.1 })

    }

    const update = () => {

        let position = division.range.position * scale
        let width = division.range.width * scale

        makeSvg(g, { transform:`translate(${position.toFixed(1)}, 0)` })
        makeSvg(lineMain, { x2:width })
        makeSvg(lineEnd, { x1:width, x2:width })

    }

    division.on('update', update)

    division.on(/main-overlapEnter/, () => makeSvg(lineMain, { 'stroke-width':3 }))
    division.on(/main-overlapExit/, () => makeSvg(lineMain, { 'stroke-width':1 }))

}

const drawLink = (helper, division, offsetY, parentOffsetY) => {

    const mix = (a, b, x) => a * (1 - x) + b * x

    let { scale } = helper

    let className = `link-${division.parent.nodeId}-${division.nodeId}`
    let path = makeSvg('path', { className, parent:helper.container, fill:'none', opacity:.25 })

    const update = () => {

        let x1 = division.parent.range.interpolate(.5) * scale
        let y1 = parentOffsetY
        let x2 = division.range.interpolate(.5) * scale
        let y2 = offsetY

        let d = `M ${shortNumber(x1)},${shortNumber(y1)} C ${shortNumber(x1)},${shortNumber(mix(y1,y2,2/3))} ${shortNumber(x2)},${shortNumber(mix(y1,y2,1/3))} ${shortNumber(x2)},${shortNumber(y2)}`
        let color = getColor(division)
        let className = `link-${division.parent.nodeId}-${division.nodeId}`
        makeSvg(path, { d, stroke:color })

    }

    division.on('update', update)

    update()

}

const createStage = (helper, divisions, { stageMargin, divisionShift, offsetHeight = 0, drawArrow = true, drawGhost = false } = {}) => {

    let stages = []
    let totalHeight = 0

    let info = new Map()

    while (divisions.length) {

        let array = [...divisions]
        divisions.length = 0
        let stage = []

        let rect = makeSvg('rect', { parent:helper.container, x:-10, y:offsetHeight + totalHeight, width:1000, opacity:.95, fill:'#ddd' })

        for (let division of array) {

            let stageIndex = 0

            while (stage[stageIndex] && stage[stageIndex].some(child => child.range.intersects(division.range))) {

                stageIndex++

            }

            stage[stageIndex] ? stage[stageIndex].push(division) : stage[stageIndex] = [division]

            let offsetY = offsetHeight + totalHeight + (stageIndex + .5) * divisionShift + stageMargin * .5

            drawDivision(helper, division, offsetY, { drawArrow, drawGhost })

            info.set(division, { offsetY })

            if (stages.length > 0) {

                drawLink(helper, division, offsetY, info.get(division.parent).offsetY)

            }

            divisions.push(...division.children)

        }

        let height = stage.length * divisionShift + stageMargin

        totalHeight += height

        makeSvg(rect, { height })

        stages.push(stage)

    }

    return { stages, totalHeight }

}

class SvgTimelineHelper {

    constructor(timeline, { scale = 1/16, stageMargin = 28, divisionShift = 6, headStageMargin = 10 } = {}) {

        let svg = makeSvg('svg')
        svg.classList.add('svg-timeline-helper')
        let container = makeSvg('g', { parent:svg, transform:'translate(20, 10)' })

        Object.assign(this, {

            timeline,
            svg,
            container,
            scale,
            stageMargin,
            divisionShift,

        })

        this.setStyle({ height:'200px' })

        // force update
        timeline.update()

        let stage = createStage(this, [timeline.rootContainer], { stageMargin, divisionShift })
        let stage2 = createStage(this, timeline.headContainer.children,
            { offsetHeight:stage.totalHeight, drawArrow:false, drawGhost:true, stageMargin:headStageMargin, divisionShift })

        // for (let division of timeline.headContainer.children) {
        //
        //     drawDivision(this, division, stage.totalHeight, { drawArrow:false })
        //
        // }

        // NOTE: this is for drawing overlap stroke-width
        timeline.forceUpdateHeads()

    }

    setStyle(props) {

        Object.assign(this.svg.style, props)

        return this

    }

    toggleSvgDisplay(display = undefined) {

        if (display === undefined)
            display = this.svg.style.display ? null : 'none'

        this.setStyle({ display })

    }

    activeSpaceKey() {

        windowAddEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                this.toggleSvgDisplay()
                event.preventDefault()
            }
        })

        return this

    }

}

export { SvgTimelineHelper }
