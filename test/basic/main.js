
import Timeline, { Mth, helpers } from '../../src/Timeline.js'

let h = document.querySelector('.wrapper').offsetHeight

let timeline = new Timeline(h)

// add an head 'longMiddle'
timeline.head.append(new Timeline.Head({ name:'longMiddle', position:'100 + 10%', width:'100% - 2 * (100 + 10%)' }))
timeline.fetchDivision({ name:'longMiddle' }).append(new Timeline.Head({ name:'longMiddleMin', position:0 }))
timeline.fetchDivision({ name:'longMiddle' }).append(new Timeline.Head({ name:'longMiddleMax', position:'100%' }))

timeline.createDivision({

    name: 'bounds-min',
    layout: 'absolute',
    width: 300,
    position: -300,
    color: '#36f',

})

timeline.createDivision({

    name: 'bounds-max',
    layout: 'absolute',
    width: 300,
    position: '100%',
    color: '#36f',

})

timeline.createDivision({

    width: 100,

})

timeline.createDivision({

    width: '50% - 100',

})

let divAuto = timeline.createDivision({

    width: 'auto',

})

divAuto.createDivision({ width:50 })
divAuto.createDivision({ width:100 })
divAuto.createDivision({ width:50 })
divAuto.createDivision({ layout:'absolute', position:'50%' })

timeline.createDivision({

    name: 'foo',
    width: '50% - 100',

})

timeline.createDivision({ width:'100%' }).on(/overlap/, function(event) {

    // console.log('overlap', this.constructor.name, this.nodeId, event)
    // do something...

})

timeline.createDivision({ width:100 })
    .createDivision({ name:'hoho', layout:'absolute', position:'-50%', width:'100% + 2 * 50%' })
    .on(/longMiddleMax/, ({ values }) => {

        let { ratio } = values

        let x = Timeline.Mth.gain(Timeline.Mth.clamp(ratio), 3, 1/4)
        let scale = Timeline.Mth.mix(.5, 1, x)

        Object.assign(document.querySelector('#hoho > div').style, {

            transform: `scale(${scale})`,
            opacity: x,

        })

    })

timeline.createDivision({ width:'100%' })

timeline.update()

document.body.appendChild(new helpers.SvgTimelineHelper(timeline, { scale:1/4 }).svg)

timeline.head.props.position = 200
timeline.forceUpdateHeads()




timeline.onUpdate.add(() => {

    timeline.headContainer.update()
    let x = timeline.head.range.position
    document.querySelector('.wrapper > .content').style.transform = `translateY(${(-x).toFixed(1)}px)`

})

new helpers.MouseDragHelper(timeline)
new helpers.TouchDragHelper(timeline)
new helpers.MouseWheelHelper(timeline)

// bench(
//     function viaArray() {
//
//         let i = 0
//
//         for (let division of timeline.descendants) {
//             i += division.range.width
//         }
//
//         return i
//
//     },
//     function viaIterators() {
//
//         let i = 0
//
//         for (let division of timeline.iDescendants()) {
//             i += division.range.width
//         }
//
//         return i
//
//     },
//     function viaCallback() {
//
//         let i = 0
//
//         timeline.forDescendants(division => i += division.range.width)
//
//         return i
//
//     },
// )


Object.assign(window, {

    Timeline,
    timeline,

})

window.addEventListener('wheel', (event) => {



})
