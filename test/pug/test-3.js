import { Timeline } from '../../src/timeline.js'
export { Timeline }
import { query, copy } from '../../src/query.js'
export { query, copy }
import { UIEventHandler } from '../../src/UIEventHandler.js'

import { TimelineCanvas } from '../../src/timeline.canvas.js'
import { bench } from '../../src/bench.js'
export { bench }

import { Mth } from '../../src/Mth.js'
export { Mth }

export let timeline = new Timeline(800)

export let timelineCanvas = new TimelineCanvas(timeline)

// this line is important !
timeline.rootDivision.space.width.computeDelegate = (space, width) => width - space.width.absolute

timeline.division({ bound:true, name:'min', width: 300, positionMode: 'FREE', position:'0%', align: '-100%', order: -Infinity, color:'#FC4193' })
timeline.division({ bound:true, name:'max', width: 300, positionMode: 'FREE', position:'100%', align: '100%', order: Infinity, color:'#FC4193' })

for (let section of document.querySelectorAll('section')) {

	timeline.division({ section })
		.on(/overlap|init/, event => {

			let x = Mth.clamp(event.values.relative, -1, 1)

			event.target.props.section.style.transform = `translateX(${(- x * 100).toFixed(1)}%)`

		})
}

document.querySelector('div.stage').appendChild(timelineCanvas.canvas)



export let handler = new UIEventHandler(document.querySelector('.wrapper'))









// > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > //
//                                                                             //
//                            BOUNDS - BEGIN                                   //
//                                                                             //
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < //

timeline.head.friction = .1

let headPosition, headIsDragged = false, headLimit = 300

timeline.rootDivision.on('pass-main', event => {

	 timeline.head.clampVelocity(timeline.rootDivision, headLimit)

})

handler.on('drag-start', event => {

	headPosition = timeline.head.position
	headIsDragged = true
	// console.log('drag-start', headPosition)

})

handler.on('drag-end', event => {

	// timeline.head.clampVelocity(timeline.rootDivision, headLimit * 3)
	headIsDragged = false
	// console.log('drag-end', headPosition)

})

handler.on('drag', event => {

	headPosition += -event.dx

	timeline.head.forcedPosition = timeline.rootDivision.getLimitedValue(headPosition, headLimit)
	// console.log('drag', headPosition)

})

timeline.on('update', event => {

	if (!headIsDragged)
		timeline.rootDivision.bringBackHeadInside({ head: timeline.head })

	timeline.head.position = timeline.rootDivision.range.clamp(timeline.head.position, headLimit)

	console.line('head', `head.roundPosition: ${timeline.head.roundPosition.toFixed(3)} time: ${performance.now().toFixed(2)}ms`)

})

// > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > //
//                                                                             //
//                             BOUNDS - END                                    //
//                                                                             //
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < //












document.querySelector('input[type=range]').oninput = event => {

	headLimit = parseFloat(event.target.value)

	timeline.division('bound').forEach(division => division.width = headLimit)
	document.querySelector('input[type=range] + label').innerHTML = `overflow limit (${headLimit})`


}
