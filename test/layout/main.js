
import Timeline from '../../src/Timeline.js'

let timeline = new Timeline(1000)

timeline.createDivision({
    name: 'd1',
    width: 300,
})

timeline.createDivision({
    name: 'd2',
    width: 'auto',
})
timeline.createDivision({
    parent: 'd2',
    width: 200,
})
timeline.createDivision({
    parent: 'd2',
    width: '100%',
})
timeline.createDivision({
    parent: 'd2',
    width: 200,
})

// red
timeline.createDivision({
    parent: 'd2',
    name: 'red-1',
    layout: 'absolute',
    width: '50% + 10',
    color: 'red',
})
timeline.createDivision({
    parent: 'red-1',
    name: 'red-2',
    layout: 'absolute',
    position: '100%',
    width: '100%',
    color: 'red',
})

// blue
timeline.createDivision({
    name: 'blue-1',
    color: 'blue',
    width: () => (500 + 1000 * Math.random()) | 0,
})
timeline.createDivision({
    parent: 'blue-1',
    name: 'blue-2',
    color: 'blue',
    layout: 'absolute',
    position: '25%',
})

// green
timeline.createDivision({
    name: 'green-1',
    color: 'green',
    layout: 'absolute',
    position: '100%',
    width: () => (500 + 1000 * Math.random()) | 0,
})
timeline.createDivision({
    parent: 'green-1',
    name: 'green-2',
    color: 'green',
    layout: 'absolute',
    // position: '25%',
    width: '100%',
})

timeline.update()
timeline.rootContainer.setDirty()

let svgHelper = new Timeline.helpers.SvgTimelineHelper(timeline, { scale:1/12 })
svgHelper.activeSpaceKey()
svgHelper.setStyle({ height:'100%' })
document.body.appendChild(svgHelper.svg)

setTimeout(() => console.log(timeline.toGraphString()), 100)

Object.assign(window, {
    timeline,
})
