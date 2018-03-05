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

timeline.division({ width: 0, page: true, order: Infinity, name:'end' })

for (let [index, section] of document.querySelectorAll('.wrapper section').entries()) {

	if (index === 0)
		continue

	let wrapperDivision = timeline.division({ widthMode: 'CONTENT', wrapper: true, sectionIndex: index })

	timeline.division({ width: '100%', section, page: true, content: true, sectionIndex: index })
		.addTo(wrapperDivision)
		.on(/init|progress/, event => {

			event.target.props.section.style.transform = `translateX(${((1 - event.progress) * 100).toFixed(1)}%)`

		})

}

// add SVG Step
timeline.division({ width: '80%', svgWrapper: true })
	.addTo('wrapper sectionIndex=1')
	.on(/init|progress/, event => {

		document.querySelector('svg circle.cursor').cx.baseVal.valueInSpecifiedUnits = 20 + 60 * event.progress

		let circleIndex = Math.round(event.progress * 3)

		for (let [index, circle] of document.querySelectorAll('svg circle.step').entries())
			circle.r.baseVal.value = index === circleIndex ? 16 : 8
		
	})

;[...document.querySelectorAll('svg circle.step')].forEach((circle, index, array) => {

	let n = array.length

	timeline.division({ 
		circle, 
		positionMode: 'FREE', 
		position: (100 * index / (n - 1)) + '%', 
		width: [-10, (100 / (n - 1)) + '%'], 
		align: '0%', 
		page: true,
	})
		.addTo('svgWrapper')
		// .on(/enter/, event => {

		// 	event.target.props.circle.r.baseVal.value = 16

		// })
		// .on(/exit/, event => {

		// 	event.target.props.circle.r.baseVal.value = 8

		// })

})



timeline.division({ name:'switch', position: '50%', width: 0, align: 0, })
	.addTo('content sectionIndex=2')
	.on(/pass/, event => {

		console.log(window.toto = event.target.parent.section)

		event.target.parent.props.section.style.color = event.direction === 1 ? 'white' : null

	})

timeline.division({ width: 400, positionMode: 'FREE', position:'0%', align: '-100%', order: -Infinity })
timeline.division({ width: 400, positionMode: 'FREE', position:'100%', align: '100%', order: Infinity })

// timeline.division({ name: 'exp', widthMode: 'CONTENT' })
// timeline.division({ parent: 'first:name=exp' })
// timeline.division({ parent: 'first:name=exp', name:'foo', width: '200%' })

// timeline.division({ parent: 'first:name=foo', name:'foo', align: '0%', width: '100' })


timeline.rootDivision.space.update()
timeline.head.value = 0

export let handler = new UIEventHandler(document.querySelector('.wrapper'))

// handler.on(/^((?!-x).)*$/, event => console.log(event.type))
// handler.on(/swipe/, event => console.log(event.type))

handler.on('wheel', event => {

	// console.log(event.type, event.dx)
	timeline.head.value += event.dx

	// timelineCanvas.draw()

})

handler.on('drag', event => {

	timeline.head.value += -event.dx

})

handler.on('drag-end', event => {

	timeline.head.velocityCorrectionForNearest('page')

})




export let timelineCanvas = new TimelineCanvas(timeline)
timelineCanvas.draw()

document.querySelector('div.stage').appendChild(timelineCanvas.canvas)

timeline.update()

console.log('test-1 ::: init')


