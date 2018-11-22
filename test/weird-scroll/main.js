
import Timeline, { Mth, Division, helpers } from '../../src/Timeline.js'
// import Timeline, { Mth, Division, helpers } from '../../build/Timeline.js'

import makeCircle from './makeCircle.js'

const withElement = (selector, callback) => [...document.querySelectorAll(selector)].forEach(callback)

let timeline = new Timeline(window.innerHeight)

// timeline.head.align = .5
timeline.head.setProps({ translate:'-50%' })

let circle1 = makeCircle({ parent:document.querySelector('#part3 .content:first-child') })
let circle2 = makeCircle({ parent:document.querySelector('#part3 .content:last-child') })

timeline.createDivision({

    name: 'scroll1',
    width: 'auto',

}).on(/main-progress/, ({ target:division, values }) => {

    let x = division.range.width * Mth.clamp(values.ratio, -Infinity, 1)

    document.querySelector('.main-content').style.transform = `translateY(${-x}px)`

})

timeline.createDivision({ name:'temporization-1', width:300 }).on('main-progress', ({ values }) => {

    circle1.update(values.ratio)

})

timeline.createDivision({

    name: 'scroll2',
    width: `auto - ${document.querySelector('#part3 .wrapper').offsetWidth}`,

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



withElement('#part1,#part2', (element) => {

    timeline.createDivision({ width:element.offsetHeight, parent:'scroll1' })

})

withElement('#part3 .content', (element) => {

    timeline.createDivision({ width:element.offsetWidth, parent:'scroll2' })

})

withElement('#part4,#part5', (element) => {

    timeline.createDivision({ width:element.offsetHeight, parent:'scroll3' })

})



timeline.update()



document.body.appendChild(new helpers.SvgTimelineHelper(timeline, { scale:1/24 }).svg)
new helpers.MouseDragHelper(timeline)
new helpers.TouchDragHelper(timeline)
new helpers.MouseWheelHelper(timeline, { direction:'biggestXorY' })



timeline.forceUpdateHeads()
timeline.forceUpdateHeads()



Object.assign(window, {

    Timeline,
    timeline,

})
