
import Timeline, { Mth, Division, helpers } from '../../src/Timeline.js'
// import Timeline, { Mth, Division, helpers } from '../../build/Timeline.js'

import makeCircle from './makeCircle.js'

const withElement = (selector, callback) => [...document.querySelectorAll(selector)].forEach(callback)

let timeline = new Timeline(window.innerHeight)

// timeline.head.align = .5
// timeline.head.setProps({ translate:'-50%' })
timeline.head.setProps({ width:0 })

let circle1 = makeCircle({ parent:document.querySelector('#part3 .content:first-child') })
let circle2 = makeCircle({ parent:document.querySelector('#part3 .content:last-child') })

timeline.createDivision({

    name: 'scroll1',
    width: 'auto',

}).on(/main-progress/, ({ target:division, values }) => {

    let x = division.range.width * Mth.clamp(values.ratio, -Infinity, 1)

    document.querySelector('.main-content').style.transform = `translateY(${-x}px)`

})

timeline.createDivision({ name:'bound-min', parent:'scroll1', layout:'absolute', translate:'-100%', width:'100%' })

timeline.createDivision({ name:'temporization-1', width:300 }).on('main-progress', ({ values }) => {

    circle1.update(values.ratio)

})

timeline.createDivision({

    name: 'scroll2',
    width: `auto - ${document.querySelector('#part3 .wrapper').offsetWidth}`,

}).on('update', ({ target }) => {

    console.log('update', target.width)

}).on(/main-progress/, ({ target:division, values }) => {

    let x = division.range.width * Mth.clamp(values.ratio)

    document.querySelector('#part3 .wrapper').style.transform = `translateX(${-x}px)`

})

timeline.createDivision({ name:'temporization-2', width:300 }).on('main-progress', ({ values }) => {

    circle2.update(values.ratio)

})

timeline.createDivision({

    name: 'scroll3',
    width: 'auto',

}).on(/main-progress/, ({ target:division, values }) => {

    let x = division.range.width * Mth.clamp(values.ratio, 0, Infinity)

    x += timeline.fetchDivision('scroll1').range.width

    document.querySelector('.main-content').style.transform = `translateY(${-x}px)`

})

timeline.createDivision({ name:'bound-max', parent:'scroll3', layout:'absolute', position:'100%', width:'100%' })



window.addEventListener('resize', (event) => {

    let width = `auto - ${document.querySelector('#part3 .wrapper').offsetWidth}`
    // setProps will auto re-render the timeline
    timeline.fetchDivision('scroll2').setProps({ width })

})

// populating divisions:

withElement('#part1,#part2', (element) => {

    timeline.createDivision({ name:element.id, width:element.offsetHeight, parent:'scroll1' })

})

timeline.createDivision({ parent:'scroll2', layout:'absolute', color:'green', position:'100%' })

withElement('#part3 .content', (element) => {

    timeline.createDivision({ name:element.id, width:element.offsetWidth, parent:'scroll2' })

})

withElement('#part4,#part5', (element) => {

    timeline.createDivision({ name:element.id, width:element.offsetHeight, parent:'scroll3' })

})



timeline.update()
timeline.rootContainer.setDirty()

timeline.createDivision({
    name: 'qux',
    layout: 'absolute',
    width: () => Math.random() * 1000 | 0,
    color: 'blue',
}).createDivision({
    name: 'foo',
    layout: 'absolute',
    position: '100%',
    width: '100%',
    color: 'red',
})



let svgHelper = new helpers.SvgTimelineHelper(timeline, { scale:1/24 })
svgHelper.activeSpaceKey()
document.body.appendChild(svgHelper.svg)

new helpers.MouseDragHelper(timeline)
new helpers.TouchDragHelper(timeline)
new helpers.MouseWheelHelper(timeline, { direction:'biggestXorY' })



Object.assign(window, {

    Timeline,
    timeline,

})
