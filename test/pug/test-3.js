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




timeline.head.friction = .1

let headValue, headIsDragged = false, headLimit = 300

handler.on('drag-start', event => {

	headValue = timeline.head.value
	headIsDragged = true
	// console.log('drag-start', headValue)

})

handler.on('drag-end', event => {

	headIsDragged = false
	// console.log('drag-end', headValue)

})

handler.on('drag', event => {

	headValue += -event.dx

	timeline.head.value = timeline.rootDivision.getLimitedValue(headValue, headLimit)
	// console.log('drag', headValue)

})

timeline.on('frame', event => {

	if (!headIsDragged && !timeline.rootDivision.space.range.contains(timeline.head.value)) {

		if (timeline.head.value < timeline.rootDivision.space.range.min)
			timeline.head.value += (timeline.rootDivision.space.range.min - timeline.head.value) * .15

		if (timeline.head.value > timeline.rootDivision.space.range.max)
			timeline.head.value += (timeline.rootDivision.space.range.max - timeline.head.value) * .15

	}

	console.line('head', `head.value: ${timeline.head.value.toFixed(3)}`)

})










document.querySelector('input[type=range]').oninput = event => {

	headLimit = parseFloat(event.target.value)

	timeline.division('bound').forEach(division => division.width = headLimit)
	document.querySelector('input[type=range] + label').innerHTML = `outside limit (${headLimit})`


}
