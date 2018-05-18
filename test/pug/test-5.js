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

let width = 800

export let timeline = new Timeline(width)

timeline.on('update', event => console.line('timeline', 'update: ' + timeline.updateCost.average.toFixed(2) + 'ms'))

let sections = document.querySelectorAll('section')

for (let index of Mth.range(100))
	timeline.division({ index })
		.on(/overlapEnter/, ({ target }) => {

			let { index } = target.props
			let section = sections[index % sections.length]
			section.innerHTML = `this is the ${index}th division!`

		})
		.on(/overlap/, ({ target, values: { absolute, absoluteClamp, relative } }) => {

			let { index } = target.props
			let section = sections[index % sections.length]
			section.style.transform = `translateX(${-absolute}px)`

		})
			.division({ positionMode: 'FREE', align: 0, width: '80%' })














export let timelineCanvas = new TimelineCanvas(timeline)

document.querySelector('div.stage').appendChild(timelineCanvas.canvas)



export let handler = new UIEventHandler(document.querySelector('.wrapper'))









// > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > > //
//                                                                             //
//                            BOUNDS - BEGIN                                   //
//                                                                             //
// < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < < //

timeline.head.friction = .2

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

	timeline.head.position = timeline.rootDivision.space.range.clamp(timeline.head.position, headLimit)

	console.line('position', timeline.head.mobile.position.toFixed(3))
	console.line('velocity', timeline.head.mobile.velocity.toFixed(3))

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
