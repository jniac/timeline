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
timeline.division({ bound:true, name:'min', width: '300%', positionMode: 'FREE', position:'0%', align: '-100%', order: -Infinity, color:'#FC4193' })
timeline.division({ bound:true, name:'max', width: '300%', positionMode: 'FREE', position:'100%', align: '100%', order: Infinity, color:'#FC4193' })

for (let section of document.querySelectorAll('section')) {

	timeline.division({ section })
		.on(/overlap|init/, event => {

			let x = Mth.clamp(event.values.relative, -1, 1)

			event.target.props.section.style.transform = `translateX(${(- x * 100).toFixed(1)}%)`

		})
}

document.querySelector('div.stage').appendChild(timelineCanvas.canvas)



export let handler = new UIEventHandler(document.querySelector('.wrapper'))




let headValue, headIsDragged = false

handler.on('drag-start', event => {

	headValue = timeline.head.value
	headIsDragged = true

})

handler.on('drag-end', event => {

	headIsDragged = false

})

handler.on('drag', event => {

	headValue += -event.dx

	timeline.head.value = timeline.rootDivision.getLimitedValue(headValue, 300)

})

timeline.on('frame', event => {

	if (!headIsDragged && !timeline.rootDivision.space.range.contains(timeline.head.value)) {

		if (timeline.head.value < timeline.rootDivision.space.range.min)
			timeline.head.value += (timeline.rootDivision.space.range.min - timeline.head.value) * .2

		if (timeline.head.value > timeline.rootDivision.space.range.max)
			timeline.head.value += (timeline.rootDivision.space.range.max - timeline.head.value) * .2

	}

})
